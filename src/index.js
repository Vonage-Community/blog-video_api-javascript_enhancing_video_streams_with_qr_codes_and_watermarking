// import the required packages

import {
  MediaProcessor,
  MediaProcessorConnector,
} from "@vonage/media-processor";
import OT from "@opentok/client";
import qrCode from "./transformers/add-qr-code";
import Watermark from "./transformers/watermark";

var publisherProperties = {
  width: "100%",
  height: "100%",
  insertMode: "append",
};
const publisher = OT.initPublisher("publisher", publisherProperties, () => {
  console.log("Publisher initialized");
});

// Watermark Code

let watermarkImage = null;

const optionSelect = document.getElementById("option-select");
const qrCodeForm = document.getElementById("qr-code-form");
const watermarkForm = document.getElementById("watermark-form");

optionSelect.addEventListener("change", function () {
  if (this.value === "qr-code") {
    qrCodeForm.classList.remove("hidden");
    watermarkForm.classList.add("hidden");
  } else {
    qrCodeForm.classList.add("hidden");
    watermarkForm.classList.remove("hidden");
  }
});

document
  .getElementById("watermark-image")
  .addEventListener("change", function () {
    const file = this.files[0];
    watermarkImage = new Image();
    // Create object URL
    const objectURL = URL.createObjectURL(file);
    // Use object URL as img source
    watermarkImage.src = objectURL;
    // Don't forget to revoke the object URL after the image has been loaded
    watermarkImage.onload = function () {
      URL.revokeObjectURL(objectURL);
    };
  });

// We need to flip the image horizontally because the publisher is flipped to avoid mirror effect
const flipImage = (srcImage) => {
  const outputImage = document.createElement("canvas");
  outputImage.width = srcImage.naturalWidth;
  outputImage.height = srcImage.naturalHeight;

  const ctx = outputImage.getContext("2d");

  // Flip the image by scaling negatively to the left
  ctx.scale(-1, 1);

  // Draw the image on the canvas
  // Starts at [-width, 0] because the flip scaled negatively
  ctx.drawImage(srcImage, -outputImage.width, 0);
  const targetImage = new Image();
  targetImage.src = outputImage.toDataURL();
  return targetImage;
};

const applyQrCode = function () {
  const text = document.getElementById("qr-text").value;
  const qrSize = document.getElementById("qr-size").value;
  const [width, height] = qrSize.split("x");
  const mediaProcessor = new MediaProcessor();
  const x = document.getElementById("x-position").value;
  const y = document.getElementById("y-position").value;
  const transformers = [new qrCode(text, Number(width), Number(height), x, y)];
  mediaProcessor.setTransformers(transformers);
  const connector = new MediaProcessorConnector(mediaProcessor);
  publisher.setVideoMediaProcessorConnector(connector);
};

const applyWatermark = () => {
  if (!watermarkImage) {
    console.log("No watermark image selected");
    return;
  }
  const position = document.getElementById("watermark-position").value;
  const mediaProcessor = new MediaProcessor();
  const transformers = [new Watermark(flipImage(watermarkImage), position)];
  mediaProcessor.setTransformers(transformers);
  const connector = new MediaProcessorConnector(mediaProcessor);
  publisher.setVideoMediaProcessorConnector(connector);
};

document.getElementById("apply-btn").addEventListener("click", function () {
  const selectedOption = document.getElementById("option-select").value;
  if (selectedOption === "qr-code") {
    applyQrCode();
  } else if (selectedOption === "watermark") {
    applyWatermark();
  } else {
    console.log("No option selected");
  }
});

document.getElementById("clear-btn").addEventListener("click", function () {
  publisher.setVideoMediaProcessorConnector(null);
});

// I need to create a web page where you can upload an image and it will be shown on the video stream.
// Same for the QR Code, you can set a link and it will be shown on the video stream.
// The added value is not the transformer per se, but the fact that you can use it in a video stream.
