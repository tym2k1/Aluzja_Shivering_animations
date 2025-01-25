let phase = 0;
let zoff = 0;
let sides = 360;
let waves = 17;
let particle_amount = 50;

let arr_particle = [];
let viable_colors =[
  "#423659",
  "#3A2831",
  "#191227",
  "#212A32",
  "#332E58",
  "#211C3C",
  "#29264F",
  "#402F42",
  "#170F21",
  "#271E34"
]

let alpha_colors = [];
let ctx;

let grainBuffer;
let grainShader;

let fpsCheckbox;

let fps, fpsLastUpdated, frameCount;

function createGradientValues(color_array) {
  for(i = 0; i < color_array.length; i++){
    gradient_color_alpha_full = color_array[i].concat("FF")
    gradient_color_alpha_none = color_array[i].concat("00")
    alpha_colors.push([gradient_color_alpha_full, gradient_color_alpha_none]);
  }
}

const vert = `
precision highp float;
attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec2 vVertTexCoord;

void main(void) {
  vec4 positionVec4 = vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
  vVertTexCoord = aTexCoord;
}
`

const frag = `
precision highp float;
varying vec2 vVertTexCoord;

uniform sampler2D source;
uniform float noiseSeed;
uniform float noiseAmount;

// Noise functions
// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float rand(vec2 n) {
  return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

void main() {
  // GorillaSun's grain algorithm
  vec4 inColor = texture2D(source, vVertTexCoord);
  gl_FragColor = clamp(inColor + vec4(
    mix(-noiseAmount, noiseAmount, fract(noiseSeed + rand(vVertTexCoord * 1234.5678))),
    mix(-noiseAmount, noiseAmount, fract(noiseSeed + rand(vVertTexCoord * 876.54321))),
    mix(-noiseAmount, noiseAmount, fract(noiseSeed + rand(vVertTexCoord * 3214.5678))),
    0.
  ), 0., 1.);
}
`

function applyGrain(noise_var) {
  grainBuffer.clear()
  grainBuffer.reset()
  grainBuffer.push()
  grainBuffer.shader(grainShader)
  grainShader.setUniform('noiseSeed', random()) // to make the grain change each frame
  grainShader.setUniform('source', canv)
  grainShader.setUniform('noiseAmount', noise_var)
  grainBuffer.rectMode(CENTER)
  grainBuffer.noStroke()
  grainBuffer.rect(0, 0, width, height)
  grainBuffer.pop()

  clear()
  push()
  image(grainBuffer, 0, 0)
  pop()
}

function logo_draw(){
  // Use polar coordinates
  translate(width / 2, height / 2);

  noFill();
  strokeWeight(0.7);
  ellipse(0, 0, sliderValues.logoRadius * 2, sliderValues.logoRadius * 2)
  for (wav_num = 1; wav_num <= waves-1; wav_num += 1) {
    beginShape();
    strokeWeight(0.7+(wav_num*(3/(waves-1))));
    for (a = -(TWO_PI/2); a <= TWO_PI/2; a += TWO_PI/sides) {
      xoff = map(cos(a + phase + wav_num * sliderValues.logoWavePhaseShift), -1, 1, 0, sliderValues.logoPerlinNoiseAmm);
      yoff = map(sin(a + phase + wav_num * sliderValues.logoWavePhaseShift), -1, 1, 0, sliderValues.logoPerlinNoiseAmm);

      r = map(
        noise(xoff, yoff, zoff), 0, 1,
        sliderValues.logoRadius - sliderValues.logoScaleNoiseDown * (abs(a) + sliderValues.logoScale) * wav_num,
        sliderValues.logoRadius + sliderValues.logoScaleNoiseUp * (abs(a) + sliderValues.logoScale) * wav_num,
        true
        );

      x = r * cos(a + sliderValues.logoPhaseStart);
      y = r * sin(a + sliderValues.logoPhaseStart);
      vertex(x, y);
      }
  endShape(CLOSE)
  phase += sliderValues.logoPhaseSpeed;
  zoff += sliderValues.zoffIncrAmm;

  }
  // Go back to normal coordinates
  translate(-width/2,-height/2);
}

class Particle{
  constructor (x, y, radius, rgb, rgb_a){
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.rgb = rgb;
    this.rgb_a = rgb_a;

    this.vx = random() * 4;
    this.vy = random() * 4;

    this.sinValue = random();
  }
  animate(){
    this.sinValue += 0.01;

    this.radius += sin(this.sinValue);
    if(this.radius <= 0){
      this.radius = abs(this.radius)
    }

    this.x += this.vx;
    this.y += this.vy;

    if(this.x < 0){
      this.vx *= -1;
      this.x += 10;
    }
    else if(this.x > width){
      this.vx *= -1;
      this.x -= 10;
    }

    if(this.y < 0){
      this.vy *= -1;
      this.y += 10;
    }
    else if(this.y > height){
      this.vy *= -1;
      this.y -= 10;
    }

    ctx.beginPath();
    const g = ctx.createRadialGradient(
      this.x,
      this.y,
      this.radius * 0.01,
      this.x,
      this.y,
      this.radius
    );

    g.addColorStop(0, this.rgb);
    g.addColorStop(1, this.rgb_a);
    ctx.fillStyle = g;
    ctx.arc(this.x, this.y, this.radius, 0, TWO_PI, false);
    ctx.fill();
  }

}

function createParticles(){
  for(i = 0; i <= particle_amount; i++){
    arr_color = random(alpha_colors);
    arr_particle[i] = new Particle(
      map(random(), 0, 1, 0, width, true),
      map(random(), 0, 1, 0, height, true),
      map(random(), 0, 1, width/4, width,true),
      arr_color[0],arr_color[1]
    )
  }
}


function updateSliderValues() {
  sliderValues = {
    logoRadius: sliders.logoRadius.value(),
    logoScale: sliders.logoScale.value(),
    logoPerlinNoiseAmm: sliders.logoPerlinNoiseAmm.value(),
    logoScaleNoiseUp: sliders.logoScaleNoiseUp.value(),
    logoScaleNoiseDown: sliders.logoScaleNoiseDown.value(),
    logoWavePhaseShift: sliders.logoWavePhaseShift.value(),
    logoPhaseSpeed: sliders.logoPhaseSpeed.value(),
    logoPhaseStart: sliders.logoPhaseStart.value(),
    zoffIncrAmm: sliders.zoffIncrAmm.value(),
    grainAmm: sliders.grainAmm.value(),
  };
}

function handleFPSDisplay() {
  frameCount++;

  if (millis() - fpsLastUpdated >= 1000) {
    fps = frameCount;
    frameCount = 0;
    fpsLastUpdated = millis();
  }

  text("FPS: " + fps, 10, 20);
}

function animateParticles() {
  for (let i = 0; i < arr_particle.length; i++) {
    arr_particle[i].animate();
  }
}

function setup() {
  canv = createCanvas(1920, 1080);
  ctx = canv.drawingContext
  ctx.globalCompositeOperation = "saturation"

  grainBuffer = createGraphics(width, height, WEBGL)
  grainShader = grainBuffer.createShader(vert, frag)

  sliders = {
    logoRadius: createSlider(0, 1000, 280, 2),
    logoScale: createSlider(0, 100, 20, 1),
    logoPerlinNoiseAmm: createSlider(0.5, 10, 1, 0.01),
    logoScaleNoiseUp: createSlider(0, 3, 0.8, 0.01),
    logoScaleNoiseDown: createSlider(0, 3, 0.8, 0.01),
    logoWavePhaseShift: createSlider(-0.1, 0.1, 0, 0.001),
    logoPhaseSpeed: createSlider(-0.001, 0.001, random(-0.001, 0.001), 0.0001),
    logoPhaseStart: createSlider(0, 2 * PI, 0, PI / 3000),
    zoffIncrAmm: createSlider(0, 0.002, 0.00015, 0.00005),
    grainAmm: createSlider(0, 0.1, 0.05, 0.001),
  };

  checkboxes = [
    { checkbox: createCheckbox('Show background', true), action: animateParticles },
    { checkbox: createCheckbox('Show logo', true), action: logo_draw },
    { checkbox: createCheckbox('Apply grain', true), action: () => applyGrain(sliderValues.grainAmm) },
    { checkbox: createCheckbox('Show FPS', false), action: handleFPSDisplay }
  ];

  fps = 0;
  fpsLastUpdated = millis();
  frameCount = 0;

  fill(255);
  textSize(16);

  blendMode(BLEND)

  stroke(255);

  createGradientValues(viable_colors);
  createParticles();
}

function draw() {

  background(0);

  updateSliderValues();

  checkboxes.forEach(({ checkbox, action }) => {
    if (checkbox.checked()) action();
  });
}
