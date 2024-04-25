
let df = null;

function select_discount(dis){
    let a;
    if(dis == 10){
        a = document.querySelector('#ten-per');
    }
    else if(dis == 20){
        a = document.querySelector('#twen-per');
    }
    else{
        a = document.querySelector('#thir-per');
    }

    if(df !== null){
        df.style.backgroundColor = 'white';
        df.style.color = 'black';
        df.style.border = '2px solid black';
    }

    if(df !== a){
        df = a;
        a.style.backgroundColor = 'black';
        a.style.color = 'white';
        a.style.border = '2px solid white';
    }
}