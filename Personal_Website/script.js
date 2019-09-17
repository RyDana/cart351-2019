// Dana RYASHY
// CART 351
// Personal website
//
// Sources:
// Cube animation was taken from David DeSandro:
// URL: https://3dtransforms.desandro.com/cube
//
// Drop down menu code was taken from W3Schools:
// URL: https://www.w3schools.com/howto/howto_js_dropdown.asp

//Starts animations once the DOM has loaded
document.addEventListener('DOMContentLoaded', function(event) {
  animateExDiv();
  animateReflDiv();
  animatePresDiv();
});

//Animates the "EXAMPLES"
function animateExDiv(){
  //variables necessary for 'exercises' div animation
  let exString = 'EXERCISES';
  let charIndex = 0;
  let frameLength = 100;
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
  }, frameLength);
}

//Animates the "REFLECTIONS"
function animateReflDiv(){
  let reflString = "REFLECTIONS"
  let reflDiv = document.getElementById("reflDiv");
  let divWidth = parseFloat(window.getComputedStyle(reflDiv).width);
  let ballArray = [];
  let ballWidth = parseFloat(window.getComputedStyle(reflDiv).fontSize)/2;
  let ballTopPos = 0;
  let lap = 5000;
  let swingAmountsMax = 15;
  let frameLength = 5;
  for(let i=0;i<reflString.length;i++){
    let ballParameters = {}
    let ball = document.createElement("div");
    ball.style.width= ballWidth + 'px'
    ball.style.height= ballWidth + 'px'
    ball.style.position = "absolute";
    ball.style.top = ballTopPos + "px";
    ballTopPos += ballWidth;
    ball.innerHTML = reflString.charAt(i)
    reflDiv.appendChild(ball);
    ballParameters.object = ball;

    let swingAmounts = swingAmountsMax - i;
    ballParameters.swingFrequency = swingAmounts/(lap/10);
    //console.log(ballParameters.swingFrequency);
    ballArray.push(ball);

    let pos = 0;
    ballParameters.t = 0;
    let animation = setInterval(frame,frameLength);
    function frame(){
      //y(t)=Asin(2πft+φ)
      pos = ((divWidth-(ballWidth*2))/2)*Math.sin(2*Math.PI*ballParameters.swingFrequency*ballParameters.t) + (divWidth/2 - ballWidth);
      //console.log("position " + pos + " time " + ballParameters.t);
      ballParameters.t ++;
      ball.style.left = pos + "px";
    }
  }
  reflDiv.style.height = (reflString.length*ballWidth) +10 + "px";
}

//Animates the "PRESENTATION"
function animatePresDiv(){
  let presDiv = document.getElementById('presDiv');
  let presString = "PRESENTATION"
  let divWidth = parseFloat(window.getComputedStyle(presDiv).width);
  let letterWidth = parseFloat(window.getComputedStyle(presDiv).fontSize)/2;
  let letterTopPos=0;
  let frameLength = 800;
  let divHeight = (presString.length*letterWidth) +10
  presDiv.style.height = divHeight + "px";
  let blind = document.createElement("div");
  blind.style.position = "absolute";
  blind.style.background = "white";
  blind.style.width = divWidth + "px";
  blindHeight = divHeight/5;
  blind.style.height = blindHeight  + "px";
  let blindPosTop = 0;
  let t = 0
  blind.style.top = divHeight/ + "px";
  presDiv.appendChild(blind);

  for(let i=0;i<presString.length;i++){
    let letter = document.createElement("div");
    letter.style.width= letterWidth + 'px'
    letter.style.height= letterWidth + 'px'
    letter.style.position = "absolute";
    letter.style.top = letterTopPos + "px";
    letterTopPos += letterWidth;
    letter.innerHTML = presString.charAt(i)
    presDiv.appendChild(letter);

    let animation = setInterval(frame,frameLength);
    function frame(){
      pos = Math.random() * (divWidth-letterWidth);
      letter.style.left = pos + "px";
    }
  }

  setInterval(function (){
    blindPosTop = (divHeight/2)*Math.sin(2*Math.PI*0.03*t) + (divHeight-blindHeight)/2;
    t++;
    blind.style.top = blindPosTop + "px";
  },10);
}

//regulates the menu dropdown
function toggleDrop() {
  console.log(event.target.id + "Drop");
  document.getElementById(event.target.id + "Drop").classList.toggle("show");
}

//closes menu dropdowns when clicked outside of it
window.onclick = function(event) {
  if (!event.target.matches('.btnDrop')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}
