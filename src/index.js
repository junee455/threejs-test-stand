import './index.css';

const { v4: uuidv4 } = require('uuid');

let infoComponent;

let infoRotation, infoPosition;

let camera;

let cameraPosition, cameraRotation;

const imageWidth = 540
const imageHeight = 960


function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function constructRequestData(photo, location_ids, session_id) {
  let fx, fy;

  fx = fy = 710;

  const requestJson = {
    attributes: {
      location_ids,
      session_id,
      timestamp: new Date().getTime(),
      client_coordinate_system: 'blender',
      tracking_pose: {
        x: 0,
        y: 0,
        z: 0,
        rx: 0,
        ry: 0,
        rz: 0,
      },
      intrinsics: {
        width: 540,
        height: 960,

        fx,
        fy,
        cx: 270.0,
        cy: 480.0,
      },
    },
  };

  const formData = new FormData();
  formData.append('image', photo);
  formData.append('json', JSON.stringify({ data: requestJson }));

  return formData;
}

async function sendToVps(formData, onResponse) {
  await fetch('https://vps-stage.naviar.io/vps/api/v3', {
      method: 'POST',
      body: formData,
      mode: 'cors',
      headers: {
        Accept: 'application/json',
      },
    }).then(
      (res) => {
        try {
          res.json().then((json) => {
            try {
              const [camPos, camRot] = vpsPoseToPosAndRot(
                json.data.attributes.vps_pose
              );

              onResponse(camPos, camRot);
            } catch {
              return;
            }
          });
        } catch (err) {
          console.log('error');
          console.log(err);
        }
      }
    ).catch((err) => {
      console.log(err);
    });
}

async function initVideo() {
  const canvas = document.getElementById('videoCanvas');

  let context = canvas.getContext('2d');

  let video = document.createElement('video');

  canvas.setAttribute('width', imageWidth);
  canvas.setAttribute('height', imageHeight);

  let videoObj = {
    video: {
      width: {
        min: 1280,
        ideal: 540,
        max: 2560,
      },
      height: {
        min: 720,
        ideal: 960,
        max: 1440,
      },
      request: ['width', 'height'],
      facingMode: 'environment',
    },
  };

  let crop;
  let raf;

  function loop() {
    context.drawImage(
      video,
      crop.dx,
      crop.dy,
      imageWidth,
      imageHeight,
      0,
      0,
      imageWidth,
      imageHeight
    );
    raf = requestAnimationFrame(loop);
  }

  navigator.mediaDevices.getUserMedia(videoObj).then((stream) => {
    let settings = stream.getVideoTracks()[0].getSettings();

    let width = settings.width;
    let height = settings.height;

    console.log(width, height);

    video.srcObject = stream;
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.onplaying = function () {
      crop = {
        w: imageWidth,
        h: imageHeight,
        sx: 0,
        sy: 0,
        dx: Math.max((width - imageWidth) / 2, 0),
        dy: Math.max((height - imageHeight) / 2, 0),
      };
      // call our loop only when the video is playing
      raf = requestAnimationFrame(loop);
    };
    video.onpause = function () {
      // stop the loop
      cancelAnimationFrame(raf);
    };
    video.play();
  });

  const imgElement = document.getElementById('camPhoto');

  const id = uuidv4();
  
  // for(;;) {
  //   await sleep(500);
  //   imgElement.setAttribute('src', canvas.toDataURL());

  //   const formData = constructRequestData(canvas.toDataURL(), ['polytech'], id);
    
  //   await sendToVps(formData, (camPos, camRot) => {
  //     console.log(camPos);
  //     console.log(camRot);
  //   })
  // }
}

async function grabACanvas() {
  const imageElement = document.getElementById('camPhoto');

  const canvas = document.querySelector("body > a-scene > canvas");

  for(;;) {
    await sleep(500);
    imageElement.setAttribute('src', canvas.toDataURL('image/png'));
  }
}

window.addEventListener('load', async () => {
  infoComponent = document.querySelector('div#info');
  infoRotation = infoComponent.querySelector('div#rotation');
  infoPosition = infoComponent.querySelector('div#position');
  camera = document.getElementById('mainCamera');

  let posX, posY, posZ;

  posX = posY = posZ = 0;

  let vx, vy, vz;

  vx = vy = vz = 0;

  const numberOfSamples = 100;

  let accelerationSamples = [];

  function sampleAcceleration(val) {
    if(accelerationSamples.length < 20) {
      accelerationSamples.push(val);
    } else {
      accelerationSamples = [...accelerationSamples.slice(1), val];
    }
  }

  function getAverageAcceleration() {
    if(!accelerationSamples.length) {
      return 0;
    }
    
    const length = accelerationSamples.length;
    let sum = 0;
    for(let val of accelerationSamples) {
      sum += val;
    }

    return sum / length;
  }

  window.addEventListener('devicemotion', (ev) => {
    const ax = ev.acceleration.x;
    const ay = ev.acceleration.y;
    let az = ev.acceleration.z;

    sampleAcceleration(az);

    az = getAverageAcceleration();
    
    const dt = ev.interval / 1000;

    posX += vx * dt + ax * dt * dt / 2;
    posY += vy * dt + ay * dt * dt / 2;
    posZ += vz * dt + az * dt * dt / 2;

    vx += ax;
    vy += ay;
    vz += az;
    
    infoPosition.innerHTML = `position: ${posX.toFixed(2)} ${posY.toFixed(2)} ${posZ.toFixed(2)}`;
  }, true);
  
  initVideo();
});



function setCameraPosition(x, y, z) {
  camera.setAttribute('position', `${x} ${y} ${z}`);
}

function setCameraRotation(x, y, z) {
  camera.setAttribute('rotation', `${x} ${y} ${z}`);
}

AFRAME.registerComponent('orientation-reader', {
  tick: function () {
    // `this.el` is the element.
    // `object3D` is the three.js object.

    // `rotation` is a three.js Euler using radians. `quaternion` also available.
    cameraRotation = this.el.object3D.rotation;

    // `position` is a three.js Vector3.
    cameraPosition = this.el.object3D.position;

    if (infoRotation) {
      infoRotation.innerHTML = `rotation: ${cameraRotation.x.toFixed(2)} ${cameraRotation.y.toFixed(2)} ${cameraRotation.z.toFixed(2)}`;
      // infoPosition.innerHTML = `position: ${cameraPosition.x.toFixed(2)} ${cameraPosition.y.toFixed(2)} ${cameraPosition.z.toFixed(2)}`;
    }
  }
});
