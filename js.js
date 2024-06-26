
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const rect = canvas.getBoundingClientRect();
const colorPicker = document.getElementById('colorPicker');
const brushSizeSlider = document.getElementById('brushSize');
const brushSizeDisplay = document.getElementById('brushSizeValue');
const canvasContainer = document.getElementById('canvas-container');
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
const containerWidth = canvasContainer.clientWidth;
const containerHeight = canvasContainer.clientHeight;
//chec
let originalData,originalImageData,
    isPenMode = false, isPencilMode = false, isEraserMode = false,
    isDrawing = false, isRectangleMode = false, isCircleMode = false,
    isTriangleMode = false, isLineMode = false, isEllipseMode=false, isIsoscelesTriangleMode=false,
    startX, startY,start_drawingX, start_drawingY ,currentX=0,currentY=0, flag=0,t=0, lastX=0, lastY=0, clientXWithinThreshold, clientYWithinThreshold, starttimerX, starttimerY ;
let actionsStack = [];
let brushSize = 10;
let penAlpha = 1;
let eraserSize = brushSize;
let timeoutId = null;
let timesetting1;
let  movement_check=0;
let matrix_mousePosition = [];
let row=0;

for (let i = 0; i < 100; i++) {
    matrix_mousePosition[i] = [];
    for (let j = 0; j < 3; j++) {
        matrix_mousePosition[i][j] = [];
    }
}

let originX = canvasWidth / 2;
let originY = canvasHeight / 2;
let isZoomInMode = false;
let isZoomOutMode = false;
let isDragMode=false;
let scale = 1;

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", Drawing);
canvas.addEventListener("mouseleave", stopdraw);


function startDraw(event) {
    if (movement_check==1){
        return;
    }

    start_drawingX = event.offsetX;
    start_drawingY = event.offsetY;

 
    if (isZoomInMode) {
        scale = scale * 2;
        updateTransform();
        
    }
    if (isZoomOutMode){
        scale /= 2;
        if (scale < 1) scale = 1;// Prevent scaling below the original size
        updateTransform();
    }
    if (isDragMode){
        updateTransform();
    }

    if (isPenMode) {
        isDrawing = false;
        handleMouseDownPen(event);
    }

    else if (isDrawing){
        isDrawing=false; 
    }

    else if (!isDrawing) {
        isDrawing = true;
    t=0;
   
   

    const color = colorPicker.value;
    const rgbaColor = hexToRgba(color, penAlpha);

    ctx.beginPath(); // creating new path to draw
    ctx.strokeStyle = rgbaColor;
    ctx.lineWidth = brushSize;
    
    // Save the current canvas state before drawing
    saveCanvasState();
    originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);

   
}
}

function Drawing(event) {

    if (row < 100) {
        time=getCurrentTime();
        matrix_mousePosition[row] = `${time},${currentX},${currentY}`;
        row++;
    }

    currentX = event.offsetX;
    currentY = event.offsetY;

    clientXWithinThreshold = Math.abs(currentX - startX) <= threshold;
    clientYWithinThreshold = Math.abs(currentY - startY) <= threshold;

    if (clientXWithinThreshold && clientYWithinThreshold) {
        if (!timeoutId){//Starting the timecount
            startX = currentX;
            startY = currentY;
            timeoutId = setTimeout(() => {
                movement_check=1;       
                 if (isPenMode) { handleMouseDownPen(event); }
                 
                 else if (isZoomInMode) {
                    scale = scale * 2;
                    updateTransform(); 
                }
            
                else if (isZoomOutMode){
                    scale /= 2;
                    if (scale < 1) scale = 1;// Prevent scaling below the original size
                        updateTransform();
                    }
            
                else if (isDragMode){
                      updateTransform();
                    }

                else if (isDrawing){
                    isDrawing=false;
                }

                else if  (!isDrawing){
                    isDrawing=true;
                }
        
                    }, timesetting); }
                }
    else{
        clearTimeout(timeoutId);
        timeoutId = null;
        startX = currentX; //startX goes back to current X
        startY = currentY;
        movement_check=0;
    }
console.log(movement_check);

    if (movement_check==1){

        clearTimeout(timeoutId); //Restart the counting
        timeoutId = null;
        movement_check=0;
        startX = currentX; 
        startY = currentY;

        if (isDrawing){ //starting now to draw because movement_check==1 conition

            const color = colorPicker.value;
            const rgbaColor = hexToRgba(color, penAlpha);
        
            ctx.beginPath(); // creating new path to draw
            ctx.strokeStyle = rgbaColor;
            ctx.lineWidth = brushSize;
            
            // Save the current canvas state before drawing
            saveCanvasState();
            originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
           
           }
        
    }

    if (movement_check==0){
        if (isDrawing==true){//allready drawing because movement_check==0 conition
            ctx.putImageData(originalData, 0, 0); 
            if (isPencilMode) {
                ctx.lineTo(currentX, currentY); // creating line according to the mouse pointer
                ctx.stroke(); // drawing/filling line with color
            } else if (isEraserMode) {
                ctx.strokeStyle = "#fff";
                ctx.lineTo(currentX, currentY); // creating line according to the mouse pointer
                ctx.stroke();
            } else if (isRectangleMode) {
                ctx.strokeRect(start_drawingX, start_drawingY, currentX - start_drawingX,currentY-start_drawingY);
            } else if (isCircleMode) {
                drawCircle(ctx, start_drawingX, start_drawingY, currentX, currentY);
            } else if (isLineMode) {
                ctx.beginPath(); // Begins a new path
                ctx.moveTo(start_drawingX, start_drawingY); // Moves the starting point of the path to the specified coordinates
                ctx.lineTo(currentX, currentY); // Draws a straight line from the current position to the specified end point
                ctx.stroke();
            } else if (isTriangleMode){ //Draw Triangle
                ctx.beginPath();
                ctx.moveTo(start_drawingX, start_drawingY); // Move to the first vertex of the triangle
                ctx.lineTo(currentX, currentY); // Draw a line to the second vertex based on mouse position
                ctx.lineTo(start_drawingX * 2 - start_drawingX, currentY); // Draw a line to the third vertex based on mouse position
                ctx.closePath();
                ctx.stroke();
            } else if (isEllipseMode) { // Draw Ellipse
                ctx.beginPath();
                ctx.ellipse((start_drawingX + currentX) / 2, (start_drawingY + currentY) / 2, Math.abs(currentX - start_drawingX) / 2, Math.abs(currentY - start_drawingY) / 2, 0, 0, 2 * Math.PI);
                ctx.stroke();
            } else if (isIsoscelesTriangleMode) { // Draw Isosceles Triangle
                ctx.beginPath();
                ctx.moveTo(start_drawingX, start_drawingY); // Move to the first vertex of the triangle
                ctx.lineTo(currentX, currentY); // Draw a line to the second vertex based on mouse position
                ctx.lineTo(2 * start_drawingX - currentX, currentY); // Draw a line to the third vertex (mirrored around startX)
                ctx.closePath();
                ctx.stroke();
            }

        }
    }
}





function stopdraw(event) {

    if (isDrawing){
        isDrawing=false; 
    }
    clearTimeout(timeoutId);
    timeoutId = null;

}

function updateTransform() {
    canvas.style.transformOrigin = `${startX}px ${startY}px`;
    canvas.style.transform = `scale(${scale})`;

} 

// Function to handle mouse down event on the canvas
function handleMouseDownPen(event) {
isDrawing= false;
saveCanvasState();

const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); // Get the image data of the canvas
const data = imageData.data; // Get the pixel data of the canvas
const color = hexToRgb(colorPicker.value);
let mouseX = currentX;
let mouseY = currentY;
if (flag ===1)
    {
        mouseX = currentX;
        mouseY = currentY;
}
const rectWidth =800; // Adjust rectangle width 
const rectHeight = 800; // Adjust rectangle height 


let xStart = Math.max(0, mouseX - Math.floor(rectWidth / 2));
let xEnd = Math.min(canvas.width, mouseX + Math.ceil(rectWidth / 2));
let yStart = Math.max(0, mouseY - Math.floor(rectHeight / 2));
let yEnd = Math.min(canvas.height, mouseY + Math.ceil(rectHeight / 2));
let rows_up_zero = Math.max(0,Math.floor(rectHeight / 2) - mouseY);
let columns_left_zero = Math.max(0,  Math.floor(rectWidth / 2) - mouseX );

console.log("flag", flag);
console.log("mouseX:", mouseX);
console.log("mouseY:", mouseY);
console.log("currentX:", currentX);
console.log("currentY:", currentY);
//console.log("xStart:", xStart);
//console.log("yStart:", yStart);
//console.log("xEnd:", xEnd);
//console.log("yEnd:", yEnd);


const grayscaleValues = Array.from({ length: rectHeight }, () => Array(rectWidth).fill(0));

for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
        const pixelIndex = (y * canvas.width + x) * 4;
        const grayscale = 0.21 * data[pixelIndex] + 0.72 * data[pixelIndex + 1] + 0.07 * data[pixelIndex + 2];
        grayscaleValues[y - yStart + rows_up_zero][x - xStart + columns_left_zero] = grayscale; // Store grayscale value in the matrix
    }
}

floodFill(Math.floor(rectWidth / 2), Math.floor(rectHeight / 2), grayscaleValues, -1); // Pass relative coordinates (always middle of rectangle) and replacement color (-1)
updateImagePixels(ctx, imageData, grayscaleValues, xStart, yStart, xEnd - xStart, yEnd - yStart, [color.r, color.g, color.b],rows_up_zero,columns_left_zero);

}


function floodFill(x, y, image, replacementColor) {
    const targetColor = image[x][y];

    // If the target color is less than 4 or the same as the replacement color, return
    if (targetColor < 4 || targetColor === replacementColor) {
        return;
    }

    const stack = [[x, y]];

    while (stack.length > 0) {
        const [cx, cy] = stack.pop();

        // Check if current position is out of bounds
        if (cx < 0 || cx >= image.length || cy < 0 || cy >= image[0].length) {
            continue;
        }

        // Check if the current pixel matches the target color
        if (image[cx][cy] === targetColor) {
            // Replace the color
            image[cx][cy] = replacementColor;

            // Add neighboring pixels to the stack
            stack.push([cx + 1, cy]); // Right
            stack.push([cx - 1, cy]); // Left
            stack.push([cx, cy + 1]); // Down
            stack.push([cx, cy - 1]); // Up
        }
    }
}


function updateImagePixels(ctx, imageData, grayscaleValues, xStart, yStart, rectWidth, rectHeight, color,rows_up_zero,columns_left_zero) {
    const data = imageData.data;

    for (let y = yStart; y < yStart + rectHeight; y++) {
        for (let x = xStart; x < xStart + rectWidth; x++) {
            const grayscaleY = y - yStart+rows_up_zero;
            const grayscaleX = x - xStart+columns_left_zero;
            const pixelIndex = (y * imageData.width + x) * 4;
            if (grayscaleValues[grayscaleY][grayscaleX] === -1) {
                data[pixelIndex] = color[0]; // Red channel
                data[pixelIndex + 1] = color[1]; // Green channel
                data[pixelIndex + 2] = color[2]; // Blue channel
                // Alpha channel remains unchanged
            }
        }
    }

// Update the canvas with the modified image data
ctx.putImageData(imageData, 0, 0);
}



function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.getElementById('imageCanvas');
                const ctx = canvas.getContext('2d');

                // Calculate the scaling factor for resizing the image
                const scaleFactor = Math.min(900 / img.width, 450 / img.height);

                // Calculate the new dimensions for the resized image
                const newWidth = img.width * scaleFactor;
                const newHeight = img.height * scaleFactor;

                // Clear the canvas to plain white
                canvas.width = 900;
                canvas.height = 450;
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw the resized image on the canvas
                ctx.drawImage(img, (canvas.width - newWidth) / 2, (canvas.height - newHeight) / 2, newWidth, newHeight);

                // Store the original image data
                originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                originalImageData = adjustBrightness(originalImageData);
                ctx.putImageData(originalImageData, 0, 0);
            };
            img.src = event.target.result; // Set the source of the image to the result of FileReader
        };

        reader.readAsDataURL(file);
    } else {
        const canvas = document.getElementById('imageCanvas');
        const ctx = canvas.getContext('2d');

        // Clear the canvas to plain white
        canvas.width = 900;
        canvas.height = 450;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Initialize originalImageData with white image data
        originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
}



function resetImage() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    ctx.putImageData(originalImageData, 0, 0); // Restore original image
  }

  function saveImage() {
    const canvas = document.getElementById('imageCanvas');
    const link = document.createElement("a");
    link.download = `${Date.now()}.jpg`;
    link.href = canvas.toDataURL();
    link.click();
  };

  function undoLastAction() {
    if (actionsStack.length > 0) {
      const lastImageData = actionsStack.pop();
      ctx.putImageData(lastImageData, 0, 0);
     // console.log("Undo action. Stack size:", actionsStack.length);
    } else {
      //console.log("No actions to undo");
    }
  }



function hexToRgb(hex) {
  const bigint = parseInt(hex.substring(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}


function printRectangleValues(grayscaleValues) {
    const rectWidth = grayscaleValues[0].length;
    const rectHeight = grayscaleValues.length;

    console.log('Rectangle Values:');
    for (let y = 0; y < rectHeight; y++) {
        let row = '';
        for (let x = 0; x < rectWidth; x++) {
            row += Math.floor(grayscaleValues[y][x]) + ' ';
        }
        console.log(row);
    }
}

function adjustBrightness(imageData) {
    for (let i = 0; i < imageData.data.length; i += 4) {
        const red = imageData.data[i];
        const green = imageData.data[i + 1];
        const blue = imageData.data[i + 2];
        // Calculate grayscale value using the luminosity method
        const grayscale = 0.21 * red + 0.72 * green + 0.07 * blue;
        // Set pixel value to 0 for grayscale value less than 128, and 255 otherwise
        imageData.data[i] = grayscale < 128 ? 0 : 255; // Red channel
        imageData.data[i + 1] = grayscale < 128 ? 0 : 255; // Green channel
        imageData.data[i + 2] = grayscale < 128 ? 0 : 255; // Blue channel
    }

    return imageData;
    }

function drawCircle(ctx, startX, startY, endX, endY) {
const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
ctx.beginPath();
ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
ctx.stroke();
}

  
const switchToPen = () => {t=0; isIsoscelesTriangleMode=false; isEllipseMode= false; isDragMode = false; isPenMode = true; Object.assign(window, {isZoomInMode: false ,isZoomOutMode: false, isPencilMode: false, isEraserMode: false, isRectangleMode: false, isCircleMode: false, isTriangleMode: false, isLineMode: false , isDrawing: false}); }
const switchToPencil = () => {isIsoscelesTriangleMode=false; isEllipseMode= false; isDragMode = false; isPenMode = false; isZoomInMode = false ;isZoomOutMode = false; isPencilMode = true; isEraserMode = false; isDrawing = false; isRectangleMode = false; isCircleMode = false; isTriangleMode = false; isLineMode = false; }
const switchToEraser = () => {isIsoscelesTriangleMode=false; isEllipseMode= false; isDragMode = false; isZoomInMode = false ;isZoomOutMode = false; isPenMode = false; isPencilMode = false; isEraserMode = true; isDrawing = false; isRectangleMode = false; isCircleMode = false; isTriangleMode = false; isLineMode = false; }
const switchToRectangle = () => {isIsoscelesTriangleMode=false; isEllipseMode= false; isDragMode = false; isZoomInMode = false ;isZoomOutMode = false; isPenMode = false; isPencilMode = false; isEraserMode = false; isDrawing = false; isRectangleMode = true; isCircleMode = false; isTriangleMode = false; isLineMode = false; }
const switchToCircle = () => {isIsoscelesTriangleMode=false; isEllipseMode= false; isDragMode = false; isZoomInMode = false ;isZoomOutMode = false; isPenMode = false; isPencilMode = false; isEraserMode = false; isDrawing = false; isRectangleMode = false; isCircleMode = true; isTriangleMode = false; isLineMode = false; }
const switchToTriangle = () => {isIsoscelesTriangleMode=false; isEllipseMode= false; isDragMode = false; isZoomInMode = false ;isZoomOutMode = false; isPenMode = false; isPencilMode = false; isEraserMode = false; isDrawing = false; isRectangleMode = false; isCircleMode = false; isTriangleMode = true; isLineMode = false; }
const switchToLine = () => {isIsoscelesTriangleMode=false; isEllipseMode= false; isDragMode = false; isZoomInMode = false ;isZoomOutMode = false; isPenMode = false; isPencilMode = false; isEraserMode = false; isDrawing = false; isRectangleMode = false; isCircleMode = false; isTriangleMode = false; isLineMode = true; }
const switchToElipsa = () => {isIsoscelesTriangleMode=false; isEllipseMode= true; isDragMode = false; isZoomInMode = false ;isZoomOutMode = false; isPenMode = false; isPencilMode = false; isEraserMode = false; isDrawing = false; isRectangleMode = false; isCircleMode = false; isTriangleMode = false; isLineMode = false; }
const switchToIsoscelesTriangle = () => {isIsoscelesTriangleMode=true; isEllipseMode= false; isDragMode = false; isZoomInMode = false ;isZoomOutMode = false; isPenMode = false; isPencilMode = false; isEraserMode = false; isDrawing = false; isRectangleMode = false; isCircleMode = false; isTriangleMode = false; isLineMode = false; }
function activateZoomInMode() {
    isIsoscelesTriangleMode=false;  isEllipseMode= false;  isDragMode = false; isZoomInMode = true; isZoomOutMode = false; isDrawing=false;  isPenMode = false; isPencilMode = false; isEraserMode = false;isDrawing = false; isRectangleMode = false; isCircleMode = false; isTriangleMode = false; isLineMode =false;        
}
function activateZoomOutMode() {
    isIsoscelesTriangleMode=false;  isEllipseMode= false;  isDragMode = false; isZoomInMode = false; isZoomOutMode = true; isDrawing=false;  isPenMode = false; isPencilMode = false; isEraserMode = false;isDrawing = false; isRectangleMode = false; isCircleMode = false; isTriangleMode = false; isLineMode =false;
}
function activateDragMode() {
    isIsoscelesTriangleMode=false; isEllipseMode= false;  isDragMode = true; isZoomInMode = false; isZoomOutMode = false; isDrawing=false;  isPenMode = false; isPencilMode = false; isEraserMode = false;isDrawing = false; isRectangleMode = false; isCircleMode = false; isTriangleMode = false; isLineMode =false;
}




const matrix_color = [
    ["#eb5196", "#Fa9d00", "#CC00FF", "#006600", "#26867d", "#0F056B", "#8B4513", "#000000"],
    ["#bd1a21", "#DFAF2C", "#FF00FF", "#009900", "#33b3a6", "#4000FF", "#8b6c5c", "#303030"],
    ["#FF0000", "#FFFF00", "#FF66FF", "#00CC00", "#3acabb", "#0000FF", "#D2B48C", "#D3D3D3"],
    ["#E26A13", "#fdfd96", "#FF99CC", "#00FF00", "#40e0d0", "#77B5FE", "#d8cbc4", "#FFFFFF"]
  ];

  
 
// Function to handle color selection from the main palette
function selectColor(color='#000000') {
    // Show the secondary color palette
    isDrawing = false;
    document.getElementById('colorPicker').value = color;
    document.getElementById("secondaryColorPalette").style.display = "block";
    document.body.classList.add('secondary-palette-visible'); // Add class to hide brush-size-container and settings

    // Populate the secondary color palette with colors relevant to the selected color
    populateSecondaryPalette(color);
}

function populateSecondaryPalette(primaryColor) {
    // Clear the existing secondary color palette
    const secondaryPalette = document.getElementById("secondaryColorPalette");
    secondaryPalette.innerHTML = "";

    // Create two columns
    for (let j = 0; j <= 7; j++) {
        let column = document.createElement("div");
        column.classList.add("color-column");
        
        // Add shades of the selected color to each column
        for (let i = 0; i <= 3; i++) {
            let shade = matrix_color[i][j]; // Adjust the shade
            addColorOption(shade, column);
        }
        
        // Append the column to the secondary color palette
        secondaryPalette.appendChild(column);
    }
}

// Function to add a color option to the secondary color palette
function addColorOption(color, column) {
    let colorOption = document.createElement("div");
    colorOption.classList.add("color-option");
    colorOption.style.backgroundColor = color;

    function selectColor() {
        // Set the colorPicker value to the selected color
        document.getElementById('colorPicker').value = color;
        document.getElementById("secondaryColorPalette").style.display = "none";
        document.body.classList.remove('secondary-palette-visible'); // Remove class to show brush-size-container and settings
        console.log("Secondary color selected:", color);
    }

    colorOption.onclick = selectColor;

    let timeoutId;

    colorOption.addEventListener('mouseenter', function() {
        timeoutId = setTimeout(selectColor,timesetting); // 3 seconds delay
    });

    colorOption.addEventListener('mouseleave', function() {
        clearTimeout(timeoutId); // Clear timeout on mouse leave
    });

    column.appendChild(colorOption);
}

// Function to lighten or darken a color
function lightenDarkenColor(col, amt) {
    var usePound = false;
    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }
    var num = parseInt(col,16);
    var r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if  (r < 0) r = 0;
    var b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255;
    else if  (b < 0) b = 0;
    var g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
}

// Function to convert hex color to RGBA with alpha
function hexToRgba(hex, alpha) {
    // Remove the hash at the start if it's there
    hex = hex.replace(/^#/, '');
    // Parse r, g, b values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    // Return the RGBA string
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


// Example of the drawing code using the updated penAlpha value
function setPenTransparency(alpha) {
    penAlpha = alpha; // Update the pen alpha value
    console.log("Setting pen transparency to", alpha);
}


  function interpolateColor(colorStart, colorEnd, step, steps) {
    // Parse the hex color codes
    let start = parseInt(colorStart.slice(1), 16);
    let end = parseInt(colorEnd.slice(1), 16);
    
    // Extract the red, green, and blue components of each color
    let startR = (start >> 16) & 0xFF;
    let startG = (start >> 8) & 0xFF;
    let startB = start & 0xFF;
    
    let endR = (end >> 16) & 0xFF;
    let endG = (end >> 8) & 0xFF;
    let endB = end & 0xFF;
    
    // Interpolate each component separately
    let r = Math.floor(startR + step * (endR - startR) / steps);
    let g = Math.floor(startG + step * (endG - startG) / steps);
    let b = Math.floor(startB + step * (endB - startB) / steps);
    
    // Combine the components and return the new color
    return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

function toggleFigures() {
    var figuresContainer = document.getElementById("figures-container");
    if (figuresContainer.style.display === "none" || figuresContainer.style.display === "") {
        figuresContainer.style.display = "block";
    } else {
        figuresContainer.style.display = "none";
    }
}

function clearFigurePalette() {
    var figuresContainer = document.getElementById("figures-container");
    figuresContainer.style.display = "none";
}

// Function to hide figures container when a figure is selected
function hideFiguresContainer() {
    var figuresContainer = document.getElementById("figures-container");
    figuresContainer.style.display = "none";
}

// Assign the new hide function to the figure buttons
function assignHideFunction() {
    var figureButtons = document.querySelectorAll('#figures-container button');
    figureButtons.forEach(function(button) {
        var originalOnClick = button.onclick;
        button.onclick = function() {
            if (originalOnClick) originalOnClick();
            hideFiguresContainer();
        }
    });
}



// Ensure the hide function is assigned after the page loads
window.onload = assignHideFunction;





// Function to handle brush size change
function setBrushSize(size) {
    // Update the brush size
    brushSize = size;
    eraserSize = size;

    // Update the display of the brush size value
    document.getElementById('brushSizeValue').textContent = brushSize;

    // Print the selected brush size
    console.log("Selected brush size:", brushSize);
}

// Function to toggle the display of the brush size frame
function toggleBrushSizeFrame() {
    const brushSizeFrame = document.getElementById('brushSizeFrame');
    brushSizeFrame.style.display = brushSizeFrame.style.display === 'none' ? 'block' : 'none';
}


// Add event listeners to brush size buttons inside the frame
document.querySelectorAll('.brush-size-buttons button').forEach(button => {
    let timeoutId;

    button.addEventListener('click', function() {
        const size = parseInt(this.textContent);
        setBrushSize(size);
        toggleBrushSizeFrame(); // Close the frame after selecting a size
    });

    button.addEventListener('mouseenter', function() {
        timeoutId = setTimeout(function() {
            button.click(); // Trigger button click after delay
        }, timesetting); 
    });

    button.addEventListener('mouseleave', function() {
        clearTimeout(timeoutId); // Clear timeout on mouse leave
    });
});



function endDraw() {
    isDrawing = false;
    console.log("End drawing");

}

function saveCanvasState() {
    actionsStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    console.log("Canvas state saved. Stack size:", actionsStack.length);

}




//setting
let timesetting = 3000; // Default timesetting value
let threshold = 20; // Default threshold value
let settingsVisible = false; // Flag to track settings panel visibility

// Function to toggle the settings panel visibility
function toggleSetting() {
    const settingsscreen = document.getElementById('settingsscreen');
    if (!settingsVisible) {
        settingsscreen.style.display = 'block';
        settingsVisible = true;
    } else {
        settingsscreen.style.display = 'none';
        settingsVisible = false;
    }
}



// Event listener for timesetting buttons
// Event listener for timesetting buttons
document.querySelectorAll('.timesetting-button').forEach(button => {
    let timeoutId;

    button.addEventListener('click', function() {
        timesetting = parseInt(this.dataset.value); // Update timesetting with button's data-value
        toggleSetting(); // Close the settings panel after selecting the option
    });

    button.addEventListener('mouseenter', function() {
        timeoutId = setTimeout(function() {
            button.click(); // Trigger button click after delay
        }, timesetting); 
    });

    button.addEventListener('mouseleave', function() {
        clearTimeout(timeoutId); // Clear timeout on mouse leave
    });
});


document.querySelectorAll('.thresholdsetting-button').forEach(button => {
    let timeoutId;

    button.addEventListener('click', function() {
        threshold = parseInt(this.dataset.value); // Update threshold with button's data-value
        toggleSetting(); // Close the settings panel after selecting the option
    });

    button.addEventListener('mouseenter', function() {
        timeoutId = setTimeout(function() {
            button.click(); // Trigger button click after delay
        }, timesetting); 
    });

    button.addEventListener('mouseleave', function() {
        clearTimeout(timeoutId); // Clear timeout on mouse leave
    });
});


// Function to toggle visibility of transparency options
function toggleTransparencyOptions() {
    const transparencyOptions = document.getElementById('transparencyOptions');
    transparencyOptions.style.display = transparencyOptions.style.display === 'block' ? 'none' : 'block';
}

// Add event listeners to transparency buttons
document.querySelectorAll('.transparency-options button').forEach(button => {
    button.addEventListener('mouseenter', function() {
        timeoutId = setTimeout(() => {
            const alpha = parseFloat(this.dataset.alpha);
            setPenTransparency(alpha); // Update the pen alpha value
            toggleTransparencyOptions(); // Hide options after selection
        }, timesetting); 
    });

    button.addEventListener('mouseleave', function() {
        clearTimeout(timeoutId); // Clear timeout if mouse leaves before 3 seconds
    });

    button.addEventListener('click', function() {
        clearTimeout(timeoutId); // Clear timeout on click, to prevent double execution
        const alpha = parseFloat(this.dataset.alpha);
        setPenTransparency(alpha); // Update the pen alpha value
        toggleTransparencyOptions(); // Hide options after selection
    });
});





//matrix

function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0'); // Ensure milliseconds have three digits
    return `${hours}:${minutes}:${seconds}.${milliseconds}`; // Return the time as a string without quotes
}

function matrixToCSV(matrix) {
    // Add headers
    const headers = 'Time,X Position,Y Position';
    const rows = matrix.join('\n'); // Join each row string with newline characters
    return `${headers}\n${rows}`;
}

// Step 3: Create a Blob from the CSV string and trigger download
function downloadCSV(filename, text) {
    const blob = new Blob([text], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url); // Clean up
    document.body.removeChild(a);
}


function MatrixDownload () {
    const csvString = matrixToCSV(matrix_mousePosition);
    downloadCSV('matrix_export.csv', csvString);
    toggleSetting(); // Close settings panel after clicking play
};


function playMusic (){
    musicPlayer.play();
    toggleSetting(); // Close settings panel after clicking play
  };
  
  function pauseMusic() {
    musicPlayer.pause();
    toggleSetting(); // Close settings panel after clicking play
  };
  
  function stopMusic()  {
    musicPlayer.pause();
    musicPlayer.currentTime = 0;
    toggleSetting(); // Close settings panel after clicking play
  };

function Pause() {
    isDragMode = false;
    isPenMode = false; 
    isZoomInMode = false;
    isZoomOutMode = false; 
    isPencilMode = false; 
    isDrawing = false; 
}

function newPage(){
    const canvasContainer = document.getElementById('canvas-container');
    canvas.width = canvasContainer.offsetWidth;
    canvas.height = canvasContainer.offsetHeight;
    // Fill the canvas with white color
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

  document.addEventListener('DOMContentLoaded', function() {

    const canvasContainer = document.getElementById('canvas-container');
    canvas.width = canvasContainer.offsetWidth;
    canvas.height = canvasContainer.offsetHeight;
    // Fill the canvas with white color
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    document.getElementById('brushSizeFrame').style.display = 'none';

    const undoButton = document.getElementById('undoButton');
    const saveButton = document.getElementById('saveButton');
    const resetImageButton = document.getElementById('resetImage');
    const newPageButton = document.getElementById('newPage');
    const fileInputButton = document.getElementById('fileInput');
    const PauseButton = document.getElementById('Pause');
    const zoomInButton = document.getElementById('ZoomIn');
    const zoomOutButton = document.getElementById('ZoomOut');
    const DragButton = document.getElementById('Drag');
    const switchToPenButton=document.getElementById('switchToPen');
    const switchToEraserButton=document.getElementById('switchToEraser');
    const switchToPencilButton=document.getElementById('switchToPencil');
    const toggleFiguresButton=document.getElementById('toggleFigures');
    const rectangleButton = document.getElementById('rectangleButton');
    const lineButton = document.getElementById('lineButton');
    const circleButton = document.getElementById('circleButton');
    const triangleButton = document.getElementById('triangleButton');
    const elipsaButton = document.getElementById('elipsaButton');
    const IsoscelesTriangleButton = document.getElementById('IsoscelesTriangle');
    const selectColorButton = document.getElementById('selectColor');
    const toggleBrushSizeButton = document.getElementById('toggleBrushSizeButtons');
    const PenTransparencyButton = document.getElementById('toggleTransparencyOptions');
    const settingsbutton=document.getElementById('settingsbutton');
    const playButton = document.getElementById('playButton');
    const pauseButton = document.getElementById('pauseButton');
    const stopButton = document.getElementById('stopButton');
    const MatrixButton = document.getElementById('downloadBtn');


    resetImageButton.addEventListener('click', resetImage);
    undoButton.addEventListener('click', undoLastAction);
    saveButton.addEventListener('click', saveImage);
    newPageButton.addEventListener('click', newPage);
    fileInputButton.addEventListener('change', handleFileSelect);
    PauseButton.addEventListener("click", Pause);
    zoomInButton.addEventListener("click", activateZoomInMode);
    zoomOutButton.addEventListener("click", activateZoomOutMode);
    DragButton.addEventListener("click", activateDragMode);
    switchToPenButton.addEventListener("click", switchToPen);
    switchToEraserButton.addEventListener("click", switchToEraser);
    switchToPencilButton.addEventListener("click", switchToPencil);
    toggleFiguresButton.addEventListener("click", toggleFigures);
    rectangleButton.addEventListener('click', switchToRectangle);
    lineButton.addEventListener('click', switchToLine);
    circleButton.addEventListener('click', switchToCircle);
    triangleButton.addEventListener('click', switchToTriangle);
    elipsaButton.addEventListener('click', switchToElipsa);
    IsoscelesTriangleButton.addEventListener('click', switchToIsoscelesTriangle);
    selectColorButton.addEventListener('click', selectColor);
    toggleBrushSizeButton.addEventListener('click',toggleBrushSizeFrame);
    PenTransparencyButton.addEventListener('click',toggleTransparencyOptions);
    settingsbutton.addEventListener('click',toggleSetting);
    playButton.addEventListener('click',playMusic);
    pauseButton.addEventListener('click',pauseMusic);
    stopButton.addEventListener('click',stopMusic);
    MatrixButton.addEventListener('click',MatrixDownload);

    // Example: handle hover delay (optional)
    [undoButton, saveButton, resetImageButton,newPageButton,PauseButton,zoomInButton,zoomOutButton,DragButton
        ,switchToPenButton,switchToEraserButton,switchToPencilButton ,toggleFiguresButton,
        rectangleButton,lineButton ,circleButton,elipsaButton,triangleButton,IsoscelesTriangleButton,
        selectColorButton,toggleBrushSizeButton,PenTransparencyButton,settingsbutton, playButton,pauseButton,stopButton,MatrixButton
    ].forEach(button => {
        let timeoutId;

        button.addEventListener('mouseenter', function() {
            timeoutId = setTimeout(function() {
                button.click(); // Trigger button click after delay
            }, timesetting); 
        });

        button.addEventListener('mouseleave', function() {
            clearTimeout(timeoutId); // Clear timeout on mouse leave
        });
    });
});















