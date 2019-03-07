#!/bin/bash
host=lampinen@rice
datadir='~/afs-home/cgi-bin/data/gl'
subdir=pilot
raw_target=../raw_data
anon_target=../anonymized_data


# download raw
scp -r ${host}:${datadir}/${subdir} ${raw_target}/${subdir}

# anonymize
mkdir -p ${anon_target}/${subdir}

i=1
for f in ${raw_target}/${subdir}/*.json
do
    cp ${f} ${anon_target}/${subdir}/${i}.json
    i=$((i+1))
done

