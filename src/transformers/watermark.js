export default class Transformer {
  constructor(image, position) {
    this.canvas_ = null;
    this.ctx_ = null;
    this._image = image;
    this._position = position || "top-right";
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

  _computePosition(frame) {
    if (this._position === "top-left") {
      return { x: frame.displayWidth - 150, y: 50 };
    } else if (this._position === "top-right") {
      return { x: 0, y: 50 };
    } else if (this._position === "bottom-left") {
      return { x: frame.displayWidth - 150, y: frame.displayHeight - 150 };
    } else if (this._position === "bottom-right") {
      return { x: 0, y: frame.displayHeight - 150 };
    }
    return { x: 0, y: 0 };
  }

  async transform(frame, controller) {
    this.canvas_.width = frame.displayWidth;
    this.canvas_.height = frame.displayHeight;
    const timestamp = frame.timestamp;

    this.ctx_.drawImage(frame, 0, 0, frame.displayWidth, frame.displayHeight);

    const { x, y } = this._computePosition(frame);
    this.ctx_.drawImage(this._image, x, y, 100, 80);
    frame.close();
    controller.enqueue(
      new VideoFrame(this.canvas_, { timestamp, alpha: "discard" })
    );
  }
}
