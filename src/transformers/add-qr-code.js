export default class Transformer {
  constructor(text, width, height, x, y, colorDark, colorLight) {
    this.canvas_ = null;
    this.ctx_ = null;
    this.text = text || "https://tokbox.com/developer/";
    this.width = width || 128;
    this.height = height || 128;
    this.colorDark = colorDark || "#000000";
    this.colorLight = colorLight || "#ffffff";
    this.x = x || 0;
    this.y = y || 0;
  }

  start() {
    this.canvas_ = new OffscreenCanvas(1, 1);
    this.ctx_ = this.canvas_.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });
    if (!this.ctx_) {
      throw new Error("Unable to create CanvasRenderingContext2D");
    }
  }

  _writeQrCode() {
    const qrContainer = document.createElement("div");
    qrContainer.id = "qr-container";
    new QRCode(qrContainer, {
      text: this.text,
      width: this.width,
      height: this.height,
      x: this.x,
      y: this.y,
    });
    return qrContainer;
  }

  async transform(frame, controller) {
    this.canvas_.width = frame.displayWidth;
    this.canvas_.height = frame.displayHeight;
    const timestamp = frame.timestamp;

    this.ctx_.drawImage(frame, 0, 0);
    const imageData = this.ctx_.getImageData(
      0,
      0,
      this.canvas_.width,
      this.canvas_.height
    );
    frame.close();
    const qrCode = this._writeQrCode(imageData);
    this.ctx_.drawImage(
      qrCode.querySelector("canvas"),
      this.x,
      this.y,
      this.width,
      this.height
    );
    controller.enqueue(
      new VideoFrame(this.canvas_, { timestamp, alpha: "discard" })
    );
  }

  flush() {
    console.log("canvas transformer flush");
  }
}
