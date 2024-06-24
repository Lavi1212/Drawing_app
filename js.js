document.getElementById('fileInput').addEventListener('change', handleFileSelect);

const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const rect = canvas.getBoundingClientRect();
const colorPicker = document.getElementById('colorPicker');
const brushSizeSlider = document.getElementById('brushSize');
const brushSizeDisplay = document.getElementById('brushSizeValue');
const undoButton = document.getElementById('undoButton'); // Assuming you have an undo button with this ID


let originalData,
    isPenMode = false, isPencilMode = false, isEraserMode = false,
    isDrawing = false, isRectangleMode = false, isCircleMode = false,
    isTriangleMode = false, isLineMode = false,
    startX, startY ,currentX=0,currentY=0, flag=0,t=0, lastX=0, lastY=0, clientXWithinThreshold, clientYWithinThreshold, starttimerX, starttimerY ;
let actionsStack = [];
let brushSize = 10;
let eraserSize = brushSize;
let timeoutId = null;
let matrix_mousePosition = [];
let row=0;

for (let i = 0; i < 100; i++) {
    matrix_mousePosition[i] = [];
    for (let j = 0; j < 3; j++) {
        matrix_mousePosition[i][j] = [];
    }
}


canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", Drawing);
canvas.addEventListener("mouseleave", stopdraw);
undoButton.addEventListener("click", undoLastAction); 

//canvas.addEventListener("mouseup", endDraw);


const canvasContainer = document.getElementById('canvas-container');
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
const containerWidth = canvasContainer.clientWidth;
const containerHeight = canvasContainer.clientHeight;



let originX = canvasWidth / 2;
let originY = canvasHeight / 2;
let isZoomInMode = false;
let isZoomOutMode = false;
let isDragMode=false;
let scale = 1;

const zoomInButton = document.getElementById('ZoomIn');
const zoomOutButton = document.getElementById('ZoomOut');
const DragButton = document.getElementById('Drag');
zoomInButton.addEventListener("click", activateZoomInMode);
zoomOutButton.addEventListener("click", activateZoomOutMode);
DragButton.addEventListener("click", activateDragMode);

//canvas.addEventListener('mousedown', handleCanvasClick);


function startDraw(event) {
    
    startX = event.offsetX;
    startY = event.offsetY;

 
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

       // if (scale < 1) scale = 1;// Prevent scaling below the original size
        updateTransform();
    }
    if (isDrawing){
        isDrawing=false; 
    }
    else {

    //console.log("rect.left:",rect.left);
   // console.log("event.clientX:",event.clientX);
   // console.log("startX:",startX);
   // console.log("event.offsetX:",event.offsetX);

    t=0;
   
    isDrawing = true;
    const color = colorPicker.value;
    ctx.beginPath(); // creating new path to draw
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    
    // Save the current canvas state before drawing
    saveCanvasState();
    originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (isPenMode) {
        isDrawing = false;
        handleMouseDownPen(event);
    }
}
}

function Drawing(event) {

    currentX =event.offsetX;
    currentY = event.offsetY;
    console.log("timesetting:",timesetting);
    console.log("threshold:",threshold);


    if (row < 100) {
        time=getCurrentTime();
        matrix_mousePosition[row] = `${time},${currentX},${currentY}`;
   row++;
}
if (row==100){
    console.log(matrix_mousePosition);
    row++;
}

    if (isPenMode && t==0) {
        startX = currentX;
        startY = currentY;
    }

    
    clientXWithinThreshold = Math.abs(currentX - startX) <= threshold;
    clientYWithinThreshold = Math.abs(currentY - startY) <= threshold;

    if (t>0){
        //console.log("t=",t);
        clientXWithinThreshold = Math.abs(currentX - lastX) <= threshold;
        clientYWithinThreshold = Math.abs(currentY - lastY) <= threshold;
    }

   

   // console.log("currentX:",currentX);
    //console.log("lastY:",lastY);
   // console.log("currentY:",currentY);
    
    if (clientXWithinThreshold && clientYWithinThreshold) {
        //console.log("notmoved, timeoutId=",timeoutId);
    
        if (!timeoutId) {
            starttimerX= currentX;
            starttimerY= currentY;
            console.log("starttimerX:",currentX);
            console.log("starttimerY:",currentY);
            timeoutId = setTimeout(() => {
                //console.log("notmoved,timeoutId=1? ",timeoutId);
                if (isDrawing) {
                    isDrawing = false;
                    //console.log("isDrawing is false");
                    timeoutId = null;
            
                }
                if (isPenMode) {
                    flag=1;
                    handleMouseDownPen(event);
                    //console.log("handleMouseDownPen");
                    flag=0;
                    timeoutId = null;
                }
          }, timesetting); // 1000 milliseconds = 1 seconds
        }
        else{
            clientXWithinThreshold = Math.abs(currentX - starttimerX) <= threshold;
            clientYWithinThreshold = Math.abs(currentY - starttimerY) <= threshold;
            if (!(clientXWithinThreshold) || !(clientYWithinThreshold)){
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        }
    }
    else{
        clearTimeout(timeoutId);
        timeoutId = null;
       // console.log("else, timeoutId=",timeoutId);
    } 

    if (!isDrawing) return; // if isDrawing is false return from here
    ctx.putImageData(originalData, 0, 0); // adding copied canvas data on to this canvas
    //console.log("check2/n");
  
 

    if (isPencilMode) {
        ctx.lineTo(currentX, currentY); // creating line according to the mouse pointer
        ctx.stroke(); // drawing/filling line with color
    } else if (isEraserMode) {
        ctx.strokeStyle = "#fff";
        ctx.lineTo(currentX, currentY); // creating line according to the mouse pointer
        ctx.stroke();
    } else if (isRectangleMode) {
        ctx.strokeRect(startX, startY, currentX - startX,currentY-startY);
    } else if (isCircleMode) {
        drawCircle(ctx, startX, startY, currentX, currentY);
    } else if (isLineMode) {
        ctx.beginPath(); // Begins a new path
        ctx.moveTo(startX, startY); // Moves the starting point of the path to the specified coordinates
        ctx.lineTo(currentX, currentY); // Draws a straight line from the current position to the specified end point
        ctx.stroke();
    }else if (isTriangleMode) { // Draw Triangle
        ctx.beginPath();
        ctx.moveTo(startX, startY); // Move to the first vertex of the triangle
        ctx.lineTo(currentX, currentY); // Draw a line to the second vertex based on mouse position
        ctx.lineTo(2 * startX - currentX, currentY); // Draw a line to the third vertex to make it isosceles
        ctx.closePath();
        ctx.stroke();
    }

    t=1;
    lastX = event.offsetX;
    lastY = event.offsetY;

   
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
let mouseX = event.offsetX;
let mouseY = event.offsetY;
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

//console.log("flag", flag);
//console.log("mouseX:", mouseX);
//console.log("mouseY:", mouseY);
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


function resetImage() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
  ctx.putImageData(originalImageData, 0, 0); // Restore original image
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.substring(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function selectColor(color) {
document.getElementById('colorPicker').value = color;
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


function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Calculate the scaling factor for resizing the image
                const scaleFactor = Math.min(900 / img.width, 450 / img.height);

                // Calculate the new dimensions for the resized image
                const newWidth = img.width * scaleFactor;
                const newHeight = img.height * scaleFactor;

                canvas.width = 900;
                canvas.height = 450;

                // Draw the resized image on the canvas
                ctx.drawImage(img, (canvas.width - newWidth) / 2, (canvas.height - newHeight) / 2, newWidth, newHeight);

                // Store the original image data
                originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                originalImageData = adjustBrightness(originalImageData);
                ctx.putImageData(originalImageData, 0, 0);
            }
            img.src = event.target.result; // Set the source of the image to the result of FileReader
        };

        reader.readAsDataURL(file);
    } else {
        // Clear the canvas to plain white
        canvas.width = canvas.width; // Clears the canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Initialize originalImageData with white image data
        originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
}

  
const switchToPen = () => {t=0, isDragMode = false; isPenMode = true; Object.assign(window, {isZoomInMode: false ,isZoomOutMode: false, isPencilMode: false, isEraserMode: false, isRectangleMode: false, isCircleMode: false, isTriangleMode: false, isLineMode: false , isDrawing: false}); }
const switchToPencil = () => {isDragMode = false; isPenMode = false; isZoomInMode = false ;isZoomOutMode = false; isPencilMode = true; isEraserMode = false; isDrawing = false; isRectangleMode = false; isCircleMode = false; isTriangleMode = false; isLineMode = false; }
const switchToEraser = () => {isDragMode = false; isZoomInMode = false ;isZoomOutMode = false; isPenMode = false; isPencilMode = false; isEraserMode = true; isDrawing = false; isRectangleMode = false; isCircleMode = false; isTriangleMode = false; isLineMode = false; }
const switchToRectangle = () => {isDragMode = false; isZoomInMode = false ;isZoomOutMode = false; isPenMode = false; isPencilMode = false; isEraserMode = false; isDrawing = false; isRectangleMode = true; isCircleMode = false; isTriangleMode = false; isLineMode = false; }
const switchToCircle = () => {isDragMode = false; isZoomInMode = false ;isZoomOutMode = false; isPenMode = false; isPencilMode = false; isEraserMode = false; isDrawing = false; isRectangleMode = false; isCircleMode = true; isTriangleMode = false; isLineMode = false; }
const switchToTriangle = () => {isDragMode = false; isZoomInMode = false ;isZoomOutMode = false; isPenMode = false; isPencilMode = false; isEraserMode = false; isDrawing = false; isRectangleMode = false; isCircleMode = false; isTriangleMode = true; isLineMode = false; }
const switchToLine = () => {isDragMode = false; isZoomInMode = false ;isZoomOutMode = false; isPenMode = false; isPencilMode = false; isEraserMode = false; isDrawing = false; isRectangleMode = false; isCircleMode = false; isTriangleMode = false; isLineMode = true; }
function activateZoomInMode() {
    isDragMode = false; isZoomInMode = true; isZoomOutMode = false; isDrawing=false;  isPenMode = false; isPencilMode = false; isEraserMode = false;isDrawing = false; isRectangleMode = false; isCircleMode = false; isTriangleMode = false; isLineMode =false;        
}
function activateZoomOutMode() {
    isDragMode = false; isZoomInMode = false; isZoomOutMode = true; isDrawing=false;  isPenMode = false; isPencilMode = false; isEraserMode = false;isDrawing = false; isRectangleMode = false; isCircleMode = false; isTriangleMode = false; isLineMode =false;
}
function activateDragMode() {
    isDragMode = true; isZoomInMode = false; isZoomOutMode = false; isDrawing=false;  isPenMode = false; isPencilMode = false; isEraserMode = false;isDrawing = false; isRectangleMode = false; isCircleMode = false; isTriangleMode = false; isLineMode =false;
}



const matrix_color = [
    ["#eb5196", "#Fa9d00", "#CC00FF", "#006600", "#26867d", "#0F056B", "#8B4513", "#000000"],
    ["#bd1a21", "#DFAF2C", "#FF00FF", "#009900", "#33b3a6", "#4000FF", "#8b6c5c", "#303030"],
    ["#FF0000", "#FFFF00", "#FF66FF", "#00CC00", "#3acabb", "#0000FF", "#D2B48C", "#D3D3D3"],
    ["#E26A13", "#fdfd96", "#FF99CC", "#00FF00", "#40e0d0", "#77B5FE", "#d8cbc4", "#FFFFFF"]
  ];

  
 
// Function to handle color selection from the main palette
function selectColor(color) {
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
    colorOption.onclick = function() {
        // Set the colorPicker value to the selected color
        document.getElementById('colorPicker').value = color;
        document.getElementById("secondaryColorPalette").style.display = "none";
        document.body.classList.remove('secondary-palette-visible'); // Remove class to show brush-size-container and settings
        console.log("Secondary color selected:", color);
    };
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



function toggleFigures() {
    var figuresContainer = document.getElementById("figures-container");
    if (figuresContainer.style.display === "none" || figuresContainer.style.display === "") {
        figuresContainer.style.display = "block";
    } else {
        figuresContainer.style.display = "none";
    }
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

// Function to populate the figures palette. 
function populateFigurePalette() {
var figuresContainer = document.getElementById("figures-container");
figuresContainer.innerHTML = ""; // Clear any existing content

// Define figure buttons
var figures = [
  { name: "Rectangle", action: switchToRectangle },
  { name: "Circle", action: switchToCircle },
  { name: "Line", action: switchToLine }
];

// Create and append figure buttons
figures.forEach(function(figure) {
  var button = document.createElement("button");
  button.textContent = figure.name;
  button.onclick = figure.action; // Assign the corresponding function to onclick
  figuresContainer.appendChild(button);
});
}


// Function to clear the figures palette
function clearFigurePalette() {
var figuresContainer = document.getElementById("figures-container");
figuresContainer.innerHTML = ""; // Clear any existing content
}

document.addEventListener("DOMContentLoaded", function() {
 

    // Set canvas size to match the size of its container
    const canvasContainer = document.getElementById('canvas-container');
    canvas.width = canvasContainer.offsetWidth;
    canvas.height = canvasContainer.offsetHeight;

    // Fill the canvas with white color
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Initialize originalImageData with white image data
    originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Optionally, you can add additional initialization code here
});



// Assuming you have a button with id "saveButton" in your HTML
const saveButton = document.getElementById("saveButton");

saveButton.addEventListener("click", () => {
    const canvas = document.getElementById('imageCanvas');
    const link = document.createElement("a");
    link.download = `${Date.now()}.jpg`;
    link.href = canvas.toDataURL();
    link.click();
});

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
//one click on the button
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('brushSizeFrame').style.display = 'none';
});



// Add event listener to toggle button
document.getElementById('toggleBrushSizeButtons').addEventListener('click', toggleBrushSizeFrame);

// Add event listeners to brush size buttons inside the frame
document.querySelectorAll('.brush-size-buttons button').forEach(button => {
    button.addEventListener('click', function() {
        const size = parseInt(this.textContent);
        setBrushSize(size);
        toggleBrushSizeFrame(); // Close the frame after selecting a size
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

function undoLastAction() {
    if (actionsStack.length >0) {
        const lastImageData = actionsStack.pop();
        ctx.putImageData(lastImageData, 0, 0);
        console.log("Undo action. Stack size:", actionsStack.length);
    } else {
        console.log("No actions to undo");
    }
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

// Event listener for the settings button to toggle settings panel visibility
document.getElementById('settingsbutton').addEventListener('click', toggleSetting);

// Event listener for Option 1 button (setting1) to set timesetting dynamically
document.getElementById('setting1').addEventListener('click', function() {
    // Handle Option 1 specific logic here if needed
});

// Event listener for timesetting buttons
document.querySelectorAll('.timesetting-button').forEach(button => {
    button.addEventListener('click', function() {
        timesetting = parseInt(this.dataset.value); // Update timesetting with button's data-value
        toggleSetting(); // Close the settings panel after selecting the option
    });
});

// Event listener for Option 2 button (setting2) to set threshold dynamically
document.getElementById('setting2').addEventListener('click', function() {
    // Handle Option 2 specific logic here if needed
});

// Event listener for threshold buttons
document.querySelectorAll('.thresholdsetting-button').forEach(button => {
    button.addEventListener('click', function() {
        threshold = parseInt(this.dataset.value); // Update threshold with button's data-value
        toggleSetting(); // Close the settings panel after selecting the option
    });
});






//musicPlayer
const musicPlayer = document.getElementById('musicPlayer');
const playButton = document.getElementById('playButton');
const pauseButton = document.getElementById('pauseButton');
const stopButton = document.getElementById('stopButton');

playButton.addEventListener('click', () => {
  musicPlayer.play();
});

pauseButton.addEventListener('click', () => {
  musicPlayer.pause();
});

stopButton.addEventListener('click', () => {
  musicPlayer.pause();
  musicPlayer.currentTime = 0;
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

// Step 4: Add event listener to download button
document.getElementById('downloadBtn').addEventListener('click', function() {
    const csvString = matrixToCSV(matrix_mousePosition);
    downloadCSV('matrix_export.csv', csvString);
});




