# $1 - number of workers
# $2 - jobType (should be capatilized)
# $3 - workerType
# $4 - numberOfJobs

declare -a pidArray
length=${#pidArray[@]}

while [ $length -lt $1 ]
do
  node lib/$3.js dev &
  pidArray[${length}]=`echo $!`
  length=`expr $length + 1`
done

node benchmark.js $4 $2

index=0
while [ $index -lt $1 ]
do
  kill -9 ${pidArray[${index}]} &> /dev/null
  index=`expr $index + 1`
done
