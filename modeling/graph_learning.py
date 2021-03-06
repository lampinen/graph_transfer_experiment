from __future__ import print_function
from __future__ import absolute_import
from __future__ import division

import numpy as np
import tensorflow as tf
import os

from graphs_and_walks import *

### Parameters
num_input_per = 15
num_output_per = 15
num_hidden = 15
num_layers = 5 # will be n-2 lstm cells + input and output layer
num_runs = 10 
run_offset = 0
learning_rate = 0.005
num_steps = 40000
eval_steps = 500
epsilon = 0.0 # noise in random walk
rec_steps = 4 # how many recurrent steps 
init_mult = 0.5
output_dir = "results_frozen/" 
input_shared = True
freeze_weights = True # freeze all but input and output weights for second training stage
save_every = 200
batch_size = 1
graphs = [three_rooms(), fixed_random_graph(), five_three_lattice(), random_graph()] # five_three_lattice(), ring(), 
###
if not os.path.exists(os.path.dirname(output_dir)):
    os.makedirs(os.path.dirname(output_dir))

var_scale_init = tf.contrib.layers.variance_scaling_initializer(factor=init_mult, mode='FAN_AVG')
nonlinearity = tf.nn.tanh

def encode_one_hot(i, task, symbols, size=num_input_per):
    res = np.zeros([1, 2*num_input_per])
    res[0, symbols[i] +  (task-1)*size] = 1.
    return res

p_i = 0.9 * 0.25 + 0.1 * 1./14
p_o = 0.1 * 1./14
optimal_loss = 4 * p_i * np.log(p_i) + 10 * p_o * np.log(p_o)
print("optimal loss for three_rooms, etc.: %f" % optimal_loss)

for run_i in xrange(run_offset, num_runs + run_offset):
    for g1 in graphs: 
        for g2 in graphs: 
            np.random.seed(run_i)
            tf.set_random_seed(run_i)
            filename_prefix = "g1%s_g2%s_rs%i_run%i" %(g1.name, g2.name, rec_steps, run_i)
            print("Now running %s" % filename_prefix)
            walk1  = noisy_random_walk(g1, num_steps, epsilon)
            eval_walk1 = noisy_random_walk(g1, eval_steps + rec_steps, epsilon)
            walk2  = noisy_random_walk(g2, num_steps, epsilon)
            eval_walk2 = noisy_random_walk(g2, eval_steps + rec_steps, epsilon)

            symbols = range(num_input_per//2) + range((num_input_per + 1)//2)
            np.random.shuffle(symbols)

            x1_data, y1_data = g1.get_full_dataset()
            x2_data, y2_data = g2.get_full_dataset()

            g1_x_data = np.concatenate([x1_data, np.zeros_like(x2_data)], axis=1)
            g1_y_data = np.concatenate([y1_data, np.zeros_like(y2_data)], axis=1)
            if input_shared:
                x2_data = x2_data[:, np.random.permutation(num_input_per)]
                g2_x_data = np.concatenate([x2_data, np.zeros_like(x2_data)], axis=1)
                g2_y_data = np.concatenate([y2_data, np.zeros_like(y2_data)], axis=1)
            else:
                g2_x_data = np.concatenate([np.zeros_like(x1_data), x2_data], axis=1)
                g2_y_data = np.concatenate([np.zeros_like(y1_data), y2_data], axis=1)

            x_data = np.concatenate([g1_x_data, g2_x_data], axis=0)

            y_data = np.concatenate([g1_y_data, g2_y_data], axis=0)

            num_datapoints = len(x_data)
            num_datapoints_per = len(g1_x_data)
                
            input_ph = tf.placeholder(tf.float32, shape=[None, rec_steps + 1, 2*num_input_per])
            eval_input_ph = tf.placeholder(tf.float32, shape=[None, 2*num_input_per])
            eval_target_ph = tf.placeholder(tf.float32, shape=[None, 2*num_input_per])

            # input
            with tf.variable_scope('lstm') as scope:
                cells = [tf.nn.rnn_cell.LSTMCell(
                    num_hidden, initializer=var_scale_init) for _ in range(num_layers - 2)]
                stacked_lstm = tf.nn.rnn_cell.MultiRNNCell(cells)

                with tf.variable_scope('input'):
                    Wi = tf.get_variable('Winput', shape=[2*num_input_per, num_hidden], initializer=var_scale_init)
                    bi = tf.get_variable('Binput', shape=[num_hidden,], initializer=tf.zeros_initializer)

                with tf.variable_scope('output'):
                    W = tf.get_variable('Woutput', shape=[num_hidden, 2*num_output_per], initializer=var_scale_init)
                    b = tf.get_variable('Boutput', shape=[2*num_output_per,], initializer=tf.zeros_initializer)

                state = stacked_lstm.zero_state(tf.shape(input_ph)[0], tf.float32)
                lstm_output = []
                for t in range(rec_steps): 
                    processed_input = nonlinearity(tf.matmul(input_ph[:, t, :], Wi) + bi)
                    this_final_hidden, state = stacked_lstm(processed_input, state)
                    scope.reuse_variables()
                    this_output = tf.matmul(this_final_hidden, W) + b
                    lstm_output.append(this_output)
                lstm_output = tf.stack(lstm_output, 1)

            target = input_ph[:, 1:, :] # next step prediction
            first_domain_loss = tf.reduce_mean(tf.nn.softmax_cross_entropy_with_logits(logits=lstm_output[:, :, :num_output_per], labels=target[:, :, :num_output_per]))
            second_domain_loss = tf.reduce_mean(tf.nn.softmax_cross_entropy_with_logits(logits=lstm_output[:, :, num_output_per:], labels=target[:, :, num_output_per:]))

            # eval only on last-step prediction (i.e. full context)
            first_domain_eval_loss = tf.reduce_mean(tf.nn.softmax_cross_entropy_with_logits(logits=lstm_output[:, -1, :num_output_per], labels=target[:, -1, :num_output_per]))
            second_domain_eval_loss = tf.reduce_mean(tf.nn.softmax_cross_entropy_with_logits(logits=lstm_output[:, -1, num_output_per:], labels=target[:, -1, num_output_per:]))

            # train only input and output weights
            all_vars = tf.trainable_variables()
            in_n_out_vars = [v for v in all_vars if 'lstm/input' in v.name or 'lstm/output' in v.name]

            total_loss = first_domain_loss + second_domain_loss
            optimizer = tf.train.RMSPropOptimizer(learning_rate)
            train = optimizer.minimize(total_loss)	
            g1_train = optimizer.minimize(first_domain_loss)
            g2_train = optimizer.minimize(second_domain_loss,
                                          var_list=in_n_out_vars if freeze_weights else None)
        

            sess_config = tf.ConfigProto()
            sess_config.gpu_options.allow_growth = True

            with tf.Session(config=sess_config) as sess:
                def train_task(task_num):   
                    global walk1, walk2
                    if task_num == 1:
                        walk = walk1
                        train = g1_train
                    else: 
                        walk = walk2
                        train = g2_train

                    this_input = [encode_one_hot(x, task_num, symbols, num_input_per) for x in walk[:rec_steps + 1]]
                    this_input = np.stack(this_input, 1)
                    sess.run(train, feed_dict={input_ph: this_input})
                    if task_num == 1:
                        walk1 = walk1[rec_steps:]
                    else:
                        walk2 = walk2[rec_steps:]


                def evaluate():
                    curr_loss1 = 0.
                    curr_loss2 = 0.
                    for step_i in range(0, eval_steps):  
                        this_input = [encode_one_hot(x, 1, symbols, num_input_per) for x in eval_walk1[step_i:step_i + rec_steps + 1]]
                        this_input = np.stack(this_input, 1)
                        curr_loss1 += sess.run(first_domain_eval_loss, feed_dict={input_ph: this_input})
                        this_input = [encode_one_hot(x, 2, symbols, num_input_per) for x in eval_walk2[step_i:step_i + rec_steps + 1]]
                        this_input = np.stack(this_input, 1)
                        curr_loss2 += sess.run(second_domain_eval_loss, feed_dict={input_ph: this_input})
                    curr_loss1 /= eval_steps
                    curr_loss2 /= eval_steps

                    return curr_loss1, curr_loss2

                
                sess.run(tf.global_variables_initializer())
                    
                with open("%s%s.csv" % (output_dir, filename_prefix), "w") as fout:
                    fout.write("step, loss1, loss2\n")
                    loss1, loss2 = evaluate()
                    print("%i, %f, %f\n" % (0, loss1, loss2))
                    fout.write("%i, %f, %f\n" % (0, loss1, loss2))
                    train_steps_per = num_steps//rec_steps
                    for step_i in xrange(1, 2 * train_steps_per):
                        if step_i < train_steps_per:
                            train_task(1)	
                        else: 
                            train_task(2)
                        if step_i % save_every == 0:
                            loss1, loss2 = evaluate()
                            print("%i, %f, %f\n" % (step_i, loss1, loss2))
                            fout.write("%i, %f, %f\n" % (step_i, loss1, loss2))

            tf.reset_default_graph()
