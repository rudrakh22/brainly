export function random(len:number){
    let options="wqjkebdbdbbdjkqb213b124bkj4bjkdbb13b434124232365758567";
    let length=options.length;
    let ans="";
    for(let i=0;i<len;i++){
        ans+=options[Math.floor(Math.random()*length)]
    }
    return ans;
}