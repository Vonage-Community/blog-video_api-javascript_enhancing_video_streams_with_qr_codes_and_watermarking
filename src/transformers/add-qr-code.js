export default class Transformer {
  constructor(
    text,
    width, // Width of the QR code data area itself
    height, // Height of the QR code data area itself
    x, // Top-left X position on the video frame
    y, // Top-left Y position on the video frame
    colorDark,
    colorLight,
    borderSize // Size of the quiet zone border in pixels
  ) {
    this.canvas_ = null;
    this.ctx_ = null;
    this.qrCanvasWithBorder_ = null; // To store the final QR code + border canvas

    this.text = text || 'https://developer.vonage.com/';
    // These are the dimensions of the QR code *data* area
    this.qrWidth = width || 128;
    this.qrHeight = height || 128;
    this.colorDark = colorDark || '#000000';
    this.colorLight = colorLight || '#ffffff'; // Usually border is white
    this.x = x || 0; // Position on the final video frame
    this.y = y || 0; // Position on the final video frame
    // Define the border size (quiet zone)
    this.borderSize =
      borderSize !== undefined && borderSize >= 0 ? borderSize : 8; // Default to 8px border

    // Calculate the final dimensions including the border
    this.finalWidth = this.qrWidth + 2 * this.borderSize;
    this.finalHeight = this.qrHeight + 2 * this.borderSize;
  }

  start() {
    // Main canvas for video frame processing
    this.canvas_ = new OffscreenCanvas(1, 1);
    this.ctx_ = this.canvas_.getContext('2d', {
      alpha: false, // Video frames likely don't need alpha
      desynchronized: true,
    });
    if (!this.ctx_) {
      throw new Error('Unable to create main CanvasRenderingContext2D');
    }

    // Generate the QR code with its border *once*
    try {
      this.qrCanvasWithBorder_ = this._createQrCodeWithBorder();
    } catch (e) {
      console.error('Failed to create QR Code with border:', e);
      // Handle error appropriately - maybe disable QR code overlay
      this.qrCanvasWithBorder_ = null; // Ensure it's null if creation failed
    }
  }

  _createQrCodeWithBorder() {
    // --- Step 1: Generate the base QR code using the library ---

    // Create a temporary container DIV (required by qrcode.js)
    // This div is never added to the document.
    let tempQrContainer = document.createElement('div');

    // Generate the QR code *without* internal padding/border from the lib
    new QRCode(tempQrContainer, {
      text: this.text,
      width: this.qrWidth, // Use the data area width
      height: this.qrHeight, // Use the data area height
      colorDark: this.colorDark,
      colorLight: this.colorLight, // Background of QR code itself
      correctLevel: QRCode.CorrectLevel.H, // Or choose appropriate level
    });

    // qrcode.js generates either a <canvas> or an <img> inside the div.
    // Prefer canvas if available.
    const originalQrCanvas = tempQrContainer.querySelector('canvas');
    const originalQrImg = tempQrContainer.querySelector('img');

    if (!originalQrCanvas && !originalQrImg) {
      throw new Error('QRCode library did not generate canvas or img element.');
    }

    // --- Step 2: Create the final canvas with the border ---

    const finalCanvas = new OffscreenCanvas(this.finalWidth, this.finalHeight);
    const finalCtx = finalCanvas.getContext('2d');

    if (!finalCtx) {
      throw new Error('Unable to create final QR CanvasRenderingContext2D');
    }

    // --- Step 3: Draw the border (background) and the QR code ---

    // Fill the entire final canvas with the border color (usually white)
    finalCtx.fillStyle = this.colorLight; // Use colorLight for the border
    finalCtx.fillRect(0, 0, this.finalWidth, this.finalHeight);

    // Draw the generated QR code (canvas or img) onto the center of the final canvas
    const drawX = this.borderSize;
    const drawY = this.borderSize;

    if (originalQrCanvas) {
      finalCtx.drawImage(
        originalQrCanvas,
        drawX,
        drawY,
        this.qrWidth,
        this.qrHeight
      );
    } else {
      // If it generated an image, draw the image
      finalCtx.drawImage(
        originalQrImg,
        drawX,
        drawY,
        this.qrWidth,
        this.qrHeight
      );
    }

    // No need for the temporary div anymore
    tempQrContainer = null; // Let garbage collection handle it

    console.log('QR Code with border generated successfully.');
    return finalCanvas; // Return the canvas with the border
  }

  async transform(frame, controller) {
    // Ensure QR code generation was successful
    if (!this.qrCanvasWithBorder_) {
      // If QR code failed, just pass the frame through unmodified
      controller.enqueue(frame);
      return;
    }

    // Resize internal canvas only if needed (slight optimization)
    if (
      this.canvas_.width !== frame.displayWidth ||
      this.canvas_.height !== frame.displayHeight
    ) {
      this.canvas_.width = frame.displayWidth;
      this.canvas_.height = frame.displayHeight;
    }
    const timestamp = frame.timestamp;

    // Draw the incoming video frame
    this.ctx_.drawImage(frame, 0, 0);
    frame.close(); // Close the original frame

    // Draw the pre-generated QR code (with border) onto the video frame
    // Use the finalWidth and finalHeight for drawing
    this.ctx_.drawImage(
      this.qrCanvasWithBorder_,
      this.x, // Position defined in constructor
      this.y, // Position defined in constructor
      this.finalWidth, // Draw with full border width
      this.finalHeight // Draw with full border height
    );

    // Enqueue the modified frame
    controller.enqueue(
      new VideoFrame(this.canvas_, { timestamp, alpha: 'discard' })
    );
  }

  flush() {
    console.log('Canvas transformer flush');
    // Clean up resources if necessary, though OffscreenCanvas might be handled by GC
    this.qrCanvasWithBorder_ = null;
  }
}
