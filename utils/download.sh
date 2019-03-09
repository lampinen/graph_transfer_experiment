#!/bin/bash
host=lampinen@rice
datadir='~/afs-home/cgi-bin/data/gl'
subdir=ex0
raw_target=../raw_data
anon_target=../anonymized_data


# download raw
mkdir -p ${raw_target}/${subdir}

scp ${host}:${datadir}/${subdir}/*.json ${raw_target}/${subdir}/

# anonymize
mkdir -p ${anon_target}/${subdir}

dictionary=${raw_target}/${subdir}/dictionary.csv
echo 'filename, index\n' > $dictionary

i=1
for f in ${raw_target}/${subdir}/*.json
do
    filename=$(basename ${f})
    cp ${f} ${anon_target}/${subdir}/${i}.json
    echo $filename, ${i} >> $dictionary
    i=$((i+1))
done

