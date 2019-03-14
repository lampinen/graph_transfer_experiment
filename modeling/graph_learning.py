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
num_hidden = 30
num_layers = 4
num_runs = 20 
learning_rate = 0.005
num_steps = 10000
epsilon = 0.1 # noise in random walk
init_mult = 1.
output_dir = "results/" 
save_every = 20
batch_size = 1
graphs = [three_rooms(), five_three_lattice(), ring(), fixed_random_graph()]
###
if not os.path.exists(os.path.dirname(output_dir)):
    os.makedirs(os.path.dirname(output_dir))

var_scale_init = tf.contrib.layers.variance_scaling_initializer(factor=init_mult, mode='FAN_AVG')
nonlinearity = tf.nn.tanh

def encode_one_hot(i, task, size=num_input_per):
    res = np.zeros([1, 2*num_input_per])
    res[0, i +  (task-1)*size] = 1.
    return res

p_i = 0.9 * 0.25 + 0.1 * 1./14
p_o = 0.1 * 1./14
optimal_loss = 4 * p_i * np.log(p_i) + 10 * p_o * np.log(p_o)
print("optimal loss for three_rooms, etc.: %f" % optimal_loss)

for run_i in xrange(num_runs):
    for g1 in graphs: 
        for g2 in graphs: 
            np.random.seed(run_i)
            tf.set_random_seed(run_i)
            filename_prefix = "g1%s_g2%s_run%i" %(g1.name, g2.name, run_i)
            print("Now running %s" % filename_prefix)
            walk1  = noisy_random_walk(g1, num_steps, epsilon)
            walk2  = noisy_random_walk(g2, num_steps, epsilon)
            x1_data, y1_data = g1.get_full_dataset()
            x2_data, y2_data = g2.get_full_dataset()
            g1_x_data = np.concatenate([x1_data, np.zeros_like(x2_data)], axis=1)
            g2_x_data = np.concatenate([np.zeros_like(x1_data), x2_data], axis=1)

            x_data = np.concatenate([g1_x_data, g2_x_data], axis=0)

            g1_y_data = np.concatenate([y1_data, np.zeros_like(y2_data)], axis=1)
            g2_y_data = np.concatenate([np.zeros_like(y1_data), y2_data], axis=1)
            y_data = np.concatenate([g1_y_data, g2_y_data], axis=0)

            num_datapoints = len(x_data)
            num_datapoints_per = len(g1_x_data)
                
            input_ph = tf.placeholder(tf.float32, shape=[None, 2*num_input_per])
            target_ph = tf.placeholder(tf.float32, shape=[None, 2*num_output_per])

            W = tf.get_variable('Wi', shape=[2*num_input_per, num_hidden], initializer=var_scale_init)
            b = tf.get_variable('Bi', shape=[num_hidden,], initializer=tf.zeros_initializer)
            hidden = nonlinearity(tf.matmul(input_ph, W) + b)

            for layer_i in range(1, num_layers-1):
                W = tf.get_variable('Wh%i' % layer_i, shape=[num_hidden, num_hidden], initializer=var_scale_init)
                b = tf.get_variable('B%i' % layer_i, shape=[num_hidden,], initializer=tf.zeros_initializer)
                hidden = nonlinearity(tf.matmul(hidden, W) + b)

            W = tf.get_variable('Wo', shape=[num_hidden, 2*num_output_per], initializer=var_scale_init)
            b = tf.get_variable('Bo', shape=[2*num_output_per,], initializer=tf.zeros_initializer)
            output = tf.matmul(hidden, W) + b
            
            first_domain_loss = tf.reduce_mean(tf.nn.softmax_cross_entropy_with_logits(logits=output[:, :num_output_per], labels=target_ph[:, :num_output_per]))
            second_domain_loss = tf.reduce_mean(tf.nn.softmax_cross_entropy_with_logits(logits=output[:, num_output_per:], labels=target_ph[:, num_output_per:]))

            total_loss = first_domain_loss + second_domain_loss
            optimizer = tf.train.GradientDescentOptimizer(learning_rate)
            train = optimizer.minimize(total_loss)	
            g1_train = optimizer.minimize(first_domain_loss)
            g2_train = optimizer.minimize(second_domain_loss)
        
            with tf.Session() as sess:
                def train_task_1():
                    curr_loc = walk1.pop(0)
                    next_loc = walk1[0]
                    sess.run(g1_train, feed_dict={input_ph: encode_one_hot(curr_loc, 1, num_input_per), target_ph: encode_one_hot(next_loc, 1, num_output_per)})


                def train_task_2():
                    curr_loc = walk2.pop(0)
                    next_loc = walk2[0]
                    sess.run(g2_train, feed_dict={input_ph: encode_one_hot(curr_loc, 2, num_input_per), target_ph: encode_one_hot(next_loc, 2, num_output_per)})


                def evaluate():
                    curr_loss1 = sess.run(first_domain_loss, feed_dict={input_ph: g1_x_data, target_ph: g1_y_data})
                    curr_loss2 = sess.run(second_domain_loss, feed_dict={input_ph: g2_x_data, target_ph: g2_y_data})
                    return curr_loss1, curr_loss2
                
                sess.run(tf.global_variables_initializer())
                    
                with open("%s%s.csv" % (output_dir, filename_prefix), "w") as fout:
                    fout.write("trial, loss1, loss2\n")
                    loss1, loss2 = evaluate()
                    print("%i, %f, %f\n" % (0, loss1, loss2))
                    fout.write("%i, %f, %f\n" % (0, loss1, loss2))
                    for trial_i in xrange(1, 2*num_steps):
                        if trial_i < num_steps:
                            train_task_1()	
                        else: 
                            train_task_2()
                        if trial_i % save_every == 0:
                            loss1, loss2 = evaluate()
                            print("%i, %f, %f\n" % (trial_i, loss1, loss2))
                            fout.write("%i, %f, %f\n" % (trial_i, loss1, loss2))

            tf.reset_default_graph()
