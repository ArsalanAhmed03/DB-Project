let df = document.querySelector('.main-body');

function clicked_on(aid){
    const b = document.querySelector('.sliding-bar');
    const c = document.querySelector('#slider');
    console.log(c);
    let a;
    if(aid == 'A'){
        a =  document.querySelector('.main-body');
        c.style.left = '2.9%';
        c.style.width = '4%';
    }
    else if(aid == 'BS'){
        a =  document.querySelector('.BS');
        c.style.left = '8.75%';
        c.style.width = '7.75%';
    }
    else if(aid == 'NR'){
        a =  document.querySelector('.NR');
        c.style.left = '19.25%';
        c.style.width = '9%';
    }
    else if(aid == 'Bks'){
        a =  document.querySelector('.Bks');
        c.style.left = '31.25%';
        c.style.width = '4.5%';
    }
    else if(aid == 'HG'){
        a =  document.querySelector('.HG');
        c.style.left = '38.5%';
        c.style.width = '9.5%';
    }
    else if(aid == 'PV'){
        a =  document.querySelector('.PV');
        c.style.left = '50.75%';
        c.style.width = '10.75%';
    }
    else if(aid == 'PC'){
        a =  document.querySelector('.PC');
        c.style.left = '64%';
        c.style.width = '4%';
    }
    else if(aid == 'E'){
        a =  document.querySelector('.E');
        c.style.left = '70.5%';
        c.style.width = '6.75%';
    }
    else if(aid == 'TG'){
        a =  document.querySelector('.TG');
        c.style.left = '80.5%';
        c.style.width = '8.5%';
    }
    else{
        a =  document.querySelector('.B');
        c.style.left = '91.5%';
        c.style.width = '4.9%';
    }
    df.style.left = '-100%';
    a.style.left = '0%';
    df = a;
};

function hide_options(){



    const a = document.querySelector('.left-options');
    const b = document.querySelectorAll('.dots');
    const c = document.querySelector('.browse-button button');
    const logo = document.querySelector('#front-logo');
    if(a.style.left === '-30%'){
        a.style.left = '0%';
        b.forEach(dot => {dot.style.backgroundColor = '#05b5fa';});
        c.style.color = 'white';
        logo.style.transform = 'scale(1.2)';
    }
    else{
        a.style.left = '-30%';
        b.forEach(dot => {dot.style.backgroundColor = 'white';});
        c.style.color = '#05b5fa';
        logo.style.transform = 'scale(1)';
    }

}