# $1 - number of jobs
# $2 - number of workers
# $3 - jobType (should be capatilized)

declare -a pidArray
length=${#pidArray[@]}

while [ $length -lt $2 ]
do
  node lib/tester.js dev &
  pidArray[${length}]=`echo $!`
  length=`expr $length + 1`
done

./runJobs.sh $1
node benchmark.js $1 $3

index=0
while [ $index -lt $2 ]
do
  kill -9 ${pidArray[${index}]} &> /dev/null
  index=`expr $index + 1`
done
