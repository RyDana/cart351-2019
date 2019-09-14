window.onload =function(){

};


document.addEventListener('DOMContentLoaded', function(event) {

  //animateExDiv();
  animateReflDiv();
})

function animateExDiv(){
  //variables necessary for 'exercises' div animation
  let exString = 'E X E R C I S E S ';
  let charIndex = 0;
  let exDiv = document.getElementById('exDiv');
  setInterval(function(){
    exDiv.innerHTML = exString.charAt(charIndex);

    if (Math.random() < 0.5){
      exDiv.classList.toggle('flip');
    }

    charIndex++;
    if(charIndex > exString.length-1){
      charIndex = 0;
    };
  }, 50);
}

function animateReflDiv(){
  let reflDiv = document.getElementById("reflDiv");
  let divWidth = parseFloat(window.getComputedStyle(reflDiv).width);
  let ballArray = [];
  let ballWidth = parseFloat(window.getComputedStyle(reflDiv).fontSize);
  let ballTopPos = 0;
  let lap = 5000;
  let swingAmountsMax = 15;
  let frameLength = 5;
  let ballAmount = 12;
  for(let i=0;i<ballAmount;i++){
    let ballParameters = {}
    let ball = document.createElement("div");
    ball.style.width= ballWidth + 'px'
    ball.style.height= ballWidth + 'px'
    ball.style.position = "absolute";
    ball.style.top = ballTopPos + "px";
    ballTopPos += ballWidth;
    ball.innerHTML = "&#9898";
    reflDiv.appendChild(ball);
    ballParameters.object = ball;

    let swingAmounts = swingAmountsMax - i;
    ballParameters.swingFrequency = swingAmounts/(lap/10);
    console.log(ballParameters.swingFrequency);
    ballArray.push(ball);

    //use sin wave instead of positions
    let pos = 0;
    ballParameters.t = 0;
    let goingRight = true;
    let animation = setInterval(frame,frameLength);
    function frame(){
      //y(t)=Asin(2πft+φ)
      pos = (divWidth/2)*Math.sin(2*Math.PI*ballParameters.swingFrequency*ballParameters.t) + divWidth/2;
      //console.log("position " + pos + " time " + ballParameters.t);
      ballParameters.t ++;
      ball.style.left = pos + "px";
    }
  }
  reflDiv.style.height = (ballAmount*ballWidth) +10 + "px";
}

// function animateReflDiv(){
//   let reflDiv = document.getElementById("reflDiv");
//   let divWidth = 420;
//   reflDiv.style.width= divWidth+"px";
//   let ballArray = [];
//   let ballWidth = 10;
//   let ballTopPos = 0;
//   let lap = 4200;
//   let swingAmountsMax = 8 ;
//   let frameLength = 5;
//   for(let i=0;i<8;i++){
//     let ballParameters = {}
//     let ball = document.createElement("div");
//     ball.style.width= ballWidth + 'px'
//     ball.style.height= ballWidth + 'px'
//     ball.style.position = "absolute";
//     ball.style.top = ballTopPos + "px";
//     ballTopPos += ballWidth;
//     ball.innerHTML = "O";
//     reflDiv.appendChild(ball);
//     ballParameters.object = ball;
//
//     let swingAmounts = swingAmountsMax - i;
//     let swingTime = lap/swingAmounts;
//     ballParameters.distPerFrame = divWidth/swingTime*frameLength;
//     console.log(ballParameters.distPerFrame);
//     console.log("swing time" + swingTime);
//     ballArray.push(ball);
//
//     //use sin wave instead of positions
//     let pos = 0;
//     let goingRight = true;
//     let animation = setInterval(frame,frameLength);
//     function frame(){
//       if(goingRight){
//         pos += ballParameters.distPerFrame;
//       } else {
//         pos -= ballParameters.distPerFrame;
//       }
//
//       if(pos === 0){
//         goingRight = true;
//       }
//       if(pos === divWidth){
//         goingRight = false;
//       }
//       ball.style.left = pos + "px";
//     }
//   }
// }
