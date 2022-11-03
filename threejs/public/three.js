import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { OBJLoader } from './OBJLoader.js';
import { MTLLoader } from './MTLLoader.js';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.17/+esm';



var canvasResolution = 10

class Interface {
    constructor({ children, gl, canvases, }) {
        this.selectedIndex = 0

        this.children = children
        this.gl = gl
        this.canvases = {
            text: canvases.text,
            image: canvases.image
        }
        this.canvas = canvases.text[this.selectedIndex]
        this.pointer = {}
        this.ctx = this.canvas.getContext('2d')
        this.offsetX = this.canvas.offsetLeft
        this.offsetY = this.canvas.offsetTop
        this.hit = -1;
        this.hitTexture = -1;

        this.lastX = 0
        this.lastY = 0
        this.draggingElement = {
            x: 0,
            y: 0,
            fontSize: 15,
            text: 'Test'
        }
        this.isDown = false
        this.texts = []
        this.textEditors = []
        this.colorPickers = []
        this.imageEditors = []
        this.nextTextColor = '#000000'
        this.nextTextFont = 'Arial'
        this.hoveringInterface = false
        this.images = []
        this.isDragging = false
    }
    create() {
        const submeshesDiv = document.getElementsByClassName('submeshes')[0]
        document.getElementsByClassName('interface')[0].addEventListener('mouseover', () => {
            this.hoveringInterface = true
        })
        document.getElementsByClassName('interface')[0].addEventListener('mouseout', () => {
            this.hoveringInterface = false
        })
        // add touch start and end for interface
        document.getElementsByClassName('interface')[0].addEventListener('touchstart', () => {
            this.hoveringInterface = true
        })
        document.getElementsByClassName('interface')[0].addEventListener('touchend', () => {
            this.hoveringInterface = false
        })
        document.getElementById('panel').addEventListener('mouseover', () => {
            this.hoveringInterface = true
        })
        document.getElementById('panel').addEventListener('mouseout', () => {
            this.hoveringInterface = false
        })

        window.addEventListener('keyup', (event) => {
            if (event.key === 'Delete' || event.key === 'Backspace')
                // only if text editor is open
                if (this.textEditors[this.selectedIndex].style.display == 'block') {
                    this.removeText(this.selectedIndex)
                } else if (this.imageEditors[this.selectedIndex].style.display == 'block') {
                    this.removeImage(this.selectedIndex)
                }
        })

        //remove all submeshes except first
        while (submeshesDiv.children.length > 0) {
            submeshesDiv.removeChild(submeshesDiv.lastChild)
        }

        for (var i = 0; i < this.children.length; i++) {
            this.texts.push([])
            this.images.push([])
            const div = document.createElement('div')
            const nameDiv = document.createElement('div')
            div.appendChild(nameDiv)
            nameDiv.textContent += this.children[i].name.toString() + "\r\n";
            nameDiv.id = this.children[i].name.toString()
            nameDiv.className = 'material'
            nameDiv.onclick = (e) => {
                var name = e.target.textContent.toString()
                var index = this.children.indexOf(this.children.find(child => child.name.trim() == name.trim()))
                if (window.innerWidth > 1000) {

                    div.children[1].style.display = div.children[1].style.display == 'none' ? 'grid' : 'none'
                } else {
                    selectMaterial(div.children[0], this.selectedIndex, index)
                }
                this.selectedIndex = index

            }
            submeshesDiv.appendChild(div)
            const submenu = document.getElementById('submenu')
            const clone = submenu.cloneNode(true)
            clone.children[0].onclick = (e) => {
                // Start Text Editor
                var name = e.target.parentElement.parentElement.children[0].textContent.toString()
                var index = this.children.indexOf(this.children.find(child => child.name.trim() == name.trim()))

                this.toggleTextEditor(index)
                this.nextTextColor = '#000000'
                for (var i = 0; i < this.children.length; i++) {
                    this.colorPickers[i].style.display = 'none'
                    this.imageEditors[i].style.display = 'none'
                    if (i != index)
                        this.textEditors[i].style.display = 'none'

                }
                this.selectedIndex = index
            }
            clone.children[1].onclick = (e) => {
                // Start Image editor
                var name = e.target.parentElement.parentElement.children[0].textContent.toString()
                var index = this.children.indexOf(this.children.find(child => child.name.trim() == name.trim()))
                this.toggleImageEditor(index)

                for (var i = 0; i < this.children.length; i++) {
                    this.textEditors[i].style.display = 'none'
                    this.colorPickers[i].style.display = 'none'
                    if (i != index)
                        this.imageEditors[i].style.display = 'none'
                }
                this.selectedIndex = index
            }


            clone.children[2].onclick = (e) => {
                // Start Text Editor
                var name = e.target.parentElement.parentElement.children[0].textContent.toString()
                var index = this.children.indexOf(this.children.find(child => child.name.trim() == name.trim()))

                this.toggleColorEditor(index)
                for (var i = 0; i < this.children.length; i++) {
                    this.textEditors[i].style.display = 'none'
                    this.imageEditors[i].style.display = 'none'
                    if (i != index)
                        this.colorPickers[i].style.display = 'none'
                }
                this.selectedIndex = index
            }





            div.appendChild(clone)
            this.initTextEditor(i)
            this.initImageEditor(i)
            this.initColorEditor(i)
        }
        const submenuMobile = document.getElementById('mobile-submenu')
        submenuMobile.children[0].addEventListener('click', (e) => {
            // Start Text Editor
            var index = this.selectedIndex


            this.toggleTextEditor(index)
            this.nextTextColor = '#000000'
            for (var i = 0; i < this.children.length; i++) {
                this.colorPickers[i].style.display = 'none'
                this.imageEditors[i].style.display = 'none'
                if (i != index)


                    this.textEditors[i].style.display = 'none'

            }
        })
        submenuMobile.children[1].addEventListener('click', (e) => {
            // Start Image editor
            var index = this.selectedIndex

            this.toggleImageEditor(index)

            for (var j = 0; j < this.children.length; j++) {
                this.textEditors[j].style.display = 'none'
                this.colorPickers[j].style.display = 'none'
                if (j != index)
                    this.imageEditors[j].style.display = 'none'
            }
        })

        return this
    }
    dragTexture(intersects) {
        var index = this.children.indexOf(this.children.find(child => child.name == intersects[0].object.name))
        this.canvas = this.canvases.image[index]
        this.ctx = this.canvas.getContext('2d')
        var uvs = intersects[0].uv

        if (this.isDragging) {
            this.gl.controls.enableRotate = false
            var hitImage = this.images[index][this.hitTexture]
            hitImage.x = uvs.x * this.canvas.width - hitImage.width / 2
            hitImage.y = this.canvas.height - uvs.y * this.canvas.height - hitImage.height / 2

        }
        this.draw(this.ctx, index)

    }
    dragText(intersects) {
        var index = this.children.indexOf(this.children.find(child => child.name == intersects[0].object.name))
        this.canvas = this.canvases.text[index]
        this.ctx = this.canvas.getContext('2d')
        var uvs = intersects[0].uv

        if (this.isDragging) {
            this.gl.controls.enableRotate = false
            var hitText = this.texts[index][this.hitText]
            hitText.x = uvs.x * this.canvas.width
            hitText.y = this.canvas.height - uvs.y * this.canvas.height

        }
        this.draw(this.ctx, index)

    }



    updateCanvasWidth(canvas, turningOn, text) {
        // update canvas width and height to 180 * canvasResolution and update the material accordingly to render the new CanvasTexture
        if (turningOn) {
            canvas.width = 180 * canvasResolution
            canvas.height = 180 * canvasResolution
        } else {
            canvas.width = 0
            canvas.height = 0
        }

        var canvasTexture = new THREE.CanvasTexture(canvas)
        if (turningOn && text) {
            console.log(this.gl.canvasTextures[canvas.id * 2 + 1]);
            this.gl.canvasTextures[canvas.id * 2 + 1] = canvasTexture
            this.gl.object.children[canvas.id].material[3].map = canvasTexture
            this.gl.object.children[canvas.id].material[3].needsUpdate = true
        } else if (turningOn && !text) {
            this.gl.canvasTextures[canvas.id * 2] = canvasTexture
            this.gl.object.children[canvas.id].material[2].map = canvasTexture
            this.gl.object.children[canvas.id].material[2].needsUpdate = true
        }
        this.ctx = canvas.getContext('2d')
        this.draw(this.ctx, canvas.id)
    }
    toggleTextEditor(i) {
        const grid = this.textEditors[i]
        this.canvas = this.canvases.text[i]
        this.ctx = this.canvas.getContext('2d')
        this.nextTextFont = 'Arial'
        if (this.textEditors[i].style.display == 'none') {
            this.addEventListenersToCanvas(i, this.canvas)
            grid.style.display = 'block'
            this.updateCanvasWidth(this.canvas, true, true)

        } else {
            this.removeEventListenersFromCanvas(i, this.canvas)
            grid.style.display = 'none'
            this.updateCanvasWidth(this.canvas, false, true)
        }

    }
    toggleColorEditor(i) {
        const colorPicker = this.colorPickers[i]
        colorPicker.style.display = colorPicker.style.display == 'none' ? 'block' : 'none'

    }
    toggleImageEditor(i) {
        this.canvas = this.canvases.image[i]

        this.ctx = this.canvas.getContext('2d')
        if (this.imageEditors[i].style.display == 'none') {
            this.addEventListenersToCanvas(i, this.canvas)
            this.updateCanvasWidth(this.canvas, true, false)

        } else {
            this.removeEventListenersFromCanvas(i, this.canvas)
            this.updateCanvasWidth(this.canvas, false, false)
        }
        const imageEditor = this.imageEditors[i]
        imageEditor.style.display = imageEditor.style.display == 'none' ? 'block' : 'none'

    }
    initImageEditor(index) {
        this.canvas = this.canvases.image[index]
        this.ctx = this.canvas.getContext('2d')


        const imageEditor = document.getElementById('image-editor')
        const clone = imageEditor.cloneNode(true)
        clone.style.display = 'none'
        imageEditor.parentElement.appendChild(clone)
        clone.insertBefore(this.canvas, clone.children[1])
        clone.children[0].children[6].textContent = this.children[index].name

        clone.children[0].children[0].addEventListener('input', (e) => {
            var imageFile = e.target.files
            this.addImage(imageFile, index)
        })
        this.imageEditors.push(clone)
        const rotationInput = clone.children[0].children[8].children[0]
        rotationInput.addEventListener('input', (event) => {
            this.images[index][this.hit].rotation = event.target.value
            this.draw(this.ctx, index)
        })

        const sizeInput = clone.children[0].children[9].children[0]
        sizeInput.addEventListener('input', (event) => {
            this.images[index][this.hit].scale = event.target.value
            this.draw(this.ctx, index)
        })

        clone.children[0].children[10].addEventListener('click', (e) => {
            this.images[index].splice(this.hit, 1)
            this.draw(this.ctx, index)
        })


        const carousel = clone.children[0].children[13]

        // if mobile
        if (window.innerWidth < 1000) {
            // loop through children of carousel

            for (var k = 0; k < carousel.children.length; k++) {
                // add image to canvas
                carousel.children[k].addEventListener('click', (e) => {
                    this.gl.placingImage = true
                    this.gl.imageToPlace = e.target
                    this.gl.placeOnIndex = index
                })
            }
        }
    }
    addTextMobile(text, index) {
        this.canvas = this.canvases.text[index]
        this.ctx = this.canvas.getContext('2d')

        var uv = this.gl.intersects[0].uv

        this.texts[index].push({

            x: uv.x * this.canvas.width,
            y: this.canvas.height - uv.y * this.canvas.height,
            fontSize: 15,
            color: this.nextTextColor,
            text: text,
            rotation: 0,
            font: this.nextTextFont
        });
        this.gl.placingText = false
        this.gl.textToPlace = null
        this.gl.placeOnIndex = null
        this.draw(this.ctx, index)
    }
    addImageMobile(file, index) {
        this.canvas = this.canvases.image[index]
        this.ctx = this.canvas.getContext('2d')


        var uv = this.gl.intersects[0].uv

        // draw on canvas
        var image = new Image();
        image.src = file.src;
        image.onload = () => {

            // push and place in center
            this.images[index].push({

                image: image,
                x: uv.x * this.canvas.width - image.width / 2,
                y: this.canvas.height - uv.y * this.canvas.height - image.height / 2,
                scale: 1,
                rotation: 0
            })


            this.gl.placingImage = false
            this.gl.imageToPlace = null
            this.gl.placeOnIndex = null
            this.draw(this.ctx, index)

        }



    }

    addImage(file, index) {
        this.canvas = this.canvases.image[index]
        this.ctx = this.canvas.getContext('2d')
        console.log(this.canvas);

        const reader = new FileReader()
        var _this = this

        reader.onload = function () {
            var image = new Image();
            image.src = reader.result;

            image.onload = function () {
                var width = image.width
                var height = image.height
                var minWidth = Math.min(width, _this.canvas.width - 100)
                var minHeight = Math.min(height, _this.canvas.height - 100)


                if (minWidth > minHeight) {
                    var scale = minHeight / height * 1
                } else {
                    var scale = minWidth / width * 1
                }
                var x = _this.canvas.width / 2 - width / 2 * scale
                var y = _this.canvas.height / 2 - height / 2 * scale
                _this.images[index].push({
                    image: image,
                    // place in center
                    x: x,
                    y: y,

                    width: 500,
                    height: 500,
                    scale: 1,
                    rotation: 0,
                })
                _this.draw(_this.ctx, index)
                _this.draw(_this.ctx, index)
            }
        }
        reader.readAsDataURL(file[0]);
    }
    initColorEditor(index) {

        const colorPicker = document.getElementById('color-picker')
        colorPicker.style.display = 'none'
        const colorPickerClone = colorPicker.cloneNode(true)
        colorPicker.parentElement.appendChild(colorPickerClone)


        colorPickerClone.children[0].addEventListener('input', (event) => {
            this.gl.updateMaterialColor(event.target.value, index)
        })
        this.colorPickers.push(colorPickerClone)

    }

    addEventListenersToCanvas = (index, canvas) => {
        this.canvas = canvas

        this.mouseMove = (event) => {
            this.handleMouseMove(event, index)
        }
        this.mouseMoveHandler = this.mouseMove.bind(this)

        this.mouseDown = (event) => {
            this.handleMouseDown(event, index)
        }
        this.mouseDownHandler = this.mouseDown.bind(this)

        this.mouseUp = (event) => {

            this.handleMouseUp(event, index)
        }
        this.mouseUpHandler = this.mouseUp.bind(this)

        this.mouseOut = (event) => {
            this.handleMouseUp(event, index)
        }

        this.mouseOutHandler = this.mouseOut.bind(this)

        canvas.addEventListener('mousemove', this.mouseMoveHandler)
        canvas.addEventListener('mousedown', this.mouseDownHandler)
        canvas.addEventListener('mouseup', this.mouseUpHandler)
        canvas.addEventListener('mouseout', this.mouseOutHandler)

    }

    removeEventListenersFromCanvas = (index, canvas) => {
        this.canvas = canvas
        canvas.removeEventListener('mousemove', this.mouseMoveHandler)
        canvas.removeEventListener('mousedown', this.mouseDownHandler)
        canvas.removeEventListener('mouseup', this.mouseUpHandler)
        canvas.removeEventListener('mouseout', this.mouseOutHandler)
    }


    initTextEditor(index) {
        this.canvas = this.canvases.text[index]
        this.ctx = this.canvas.getContext('2d')
        const grid = document.getElementById('grid')

        var gridClone = grid.cloneNode(true)
        grid.parentElement.appendChild(gridClone)
        gridClone.insertBefore(this.canvas, gridClone.children[1])

        this.textEditors.push(gridClone)

        gridClone.children[0].children[10].textContent = this.children[index].name
        const textInput = gridClone.children[0].children[0]
        textInput.addEventListener('keydown', (event) => {
            if (event.key == 'Enter') {

                if (window.innerWidth < 1000) {

                    this.gl.placingText = true
                    this.gl.textToPlace = event.target.value
                    this.gl.placeOnIndex = index
                } else {
                    this.addNewText(event.target.value, index)

                }
            }

        })

        var addButton = gridClone.children[0].children[2]
        addButton.addEventListener('click', (event) => {
            if (window.innerWidth < 1000) {

                this.gl.placingText = true
                this.gl.textToPlace = textInput.value
                this.gl.placeOnIndex = index
            } else {
                this.addNewText(textInput.value, index)

            }
        })


        const textFontInput = gridClone.children[0].children[3]
        textFontInput.addEventListener('change', (event) => {
            this.nextTextFont = event.target.value;

            if (this.hit != -1) {
                this.texts[index][this.hit].font = event.target.value
                this.draw(this.ctx, index)
            }
        })
        const textColorInput = gridClone.children[0].children[7]
        textColorInput.addEventListener('input', (event) => {
            this.nextTextColor = event.target.value;
            if (this.hit != -1) {
                this.texts[index][this.hit].color = event.target.value
                this.draw(this.ctx, index)
            }
        })

        const rotationInput = gridClone.children[0].children[12].children[0]
        rotationInput.addEventListener('input', (event) => {
            this.texts[index][this.hit].rotation = event.target.value
            this.draw(this.ctx, index)
        })

        const sizeInput = gridClone.children[0].children[13].children[0]
        sizeInput.addEventListener('input', (event) => {
            this.texts[index][this.hit].fontSize = event.target.value
            this.draw(this.ctx, index)
        })

        gridClone.children[0].children[14].addEventListener('click', (event) => {
            this.texts[index].splice(this.hit, 1)
            this.draw(this.ctx, index)
        })

    }
    removeText(index) {
        this.texts[index].splice(this.hit, 1);
        this.draw(this.ctx, index)

    }
    removeImage(index) {
        this.images[index].splice(this.hit, 1);
        this.draw(this.ctx, index)
    }
    addNewText(text, index) {
        this.texts[index].push({
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            fontSize: 15,
            color: this.nextTextColor,
            text: text,
            rotation: 0,
            font: this.nextTextFont
        });
        this.draw(this.ctx, index)
    }


    draw(ctx, index) {
        var circles = this.texts[index]
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.ctx == this.canvases.text[index].getContext('2d')) {

            for (var i = 0; i < circles.length; i++) {
                var circle = circles[i];
                ctx.beginPath();
                ctx.font = circle.fontSize * canvasResolution + 'px ' + circle.font
                if (this.hit == i) {
                    ctx.shadowColor = "black";
                    ctx.shadowBlur = 7;
                    ctx.lineWidth = 5;
                } else {

                    ctx.shadowBlur = 0;
                }
                ctx.fillStyle = circle.color
                ctx.save()
                var rotation = circle.rotation * Math.PI / 50;
                if (rotation != 0) {
                    ctx.translate(circle.x, circle.y);
                }
                ctx.rotate(rotation)
                if (rotation != 0) {
                    ctx.translate(-circle.x, -circle.y);
                }
                ctx.textAlign = 'center'


                ctx.fillText(circle.text, circle.x, circle.y);
                ctx.restore()
                ctx.closePath();
                ctx.fill();
            }
        }
        var _this = this
        var images = this.images[index]
        if (this.ctx == this.canvases.image[index].getContext('2d')) {
            for (var i = 0; i < images.length; i++) {
                var image = images[i].image

                var width = image.width
                var height = image.height
                var minWidth = Math.min(width, _this.canvas.width - 100)
                var minHeight = Math.min(height, _this.canvas.height - 100)


                if (minWidth > minHeight) {
                    var scale = minHeight / height * images[i].scale
                } else {
                    var scale = minWidth / width * images[i].scale
                }
                var x = images[i].x
                var y = images[i].y


                var angle = images[i].rotation * Math.PI / 50;
                ctx.save()
                ctx.translate(x + width * scale / 2, y + height * scale / 2);
                ctx.rotate(angle)
                ctx.translate(-x - width * scale / 2, -y - height * scale / 2);

                ctx.drawImage(image, x, y, width * scale, height * scale);
                ctx.restore()


                ctx.restore()
                images[i].width = width * scale
                images[i].height = height * scale
                images[i].x = x
                images[i].y = y

            }
        }
    }
    handleMouseMove(event, index) {
        if (!this.isDown) {
            return
        }

        event.preventDefault();
        event.stopPropagation();
        // get coordinates relative to its size
        this.pointer.x = event.offsetX
        this.pointer.y = event.offsetY

        var dx = this.pointer.x - this.lastX;
        var dy = this.pointer.y - this.lastY;

        this.lastX = this.pointer.x;
        this.lastY = this.pointer.y;

        this.draggingElement.x += dx;
        this.draggingElement.y += dy;

        if (this.hitTexture != -1) {
            console.log(this.hitTexture);
        }

        this.draw(this.ctx, index)
    }
    handleMouseDown(event, index) {

        event.preventDefault();
        event.stopPropagation();

        // save the mouse position
        // in case this becomes a drag operation
        this.lastX = event.offsetX
        this.lastY = event.offsetY

        var _this = this;

        this.hit = -1


        if (this.ctx == this.canvases.text[index].getContext('2d')) {

            // hit test all existing texts
            for (var i = 0; i < this.texts[index].length; i++) {
                var text = this.texts[index][i];
                var measuredTextSize = this.ctx.measureText(text.text)

                const region = {
                    x: text.x - measuredTextSize.width / 2,
                    y: text.y - measuredTextSize.actualBoundingBoxAscent / 2,
                    width: measuredTextSize.width,
                    height: measuredTextSize.actualBoundingBoxAscent,
                }



                if (isInText(region, this.lastX, this.lastY, text, this.ctx)) {
                    this.hit = i
                }
            }

        } else if (this.ctx == this.canvases.image[index].getContext('2d')) {

            for (var i = 0; i < this.images[index].length; i++) {
                var image = this.images[index][i]
                var measuredImageSize = {
                    width: image.width,
                    height: image.height

                }
                const region = {

                    x: image.x,
                    y: image.y,
                    width: measuredImageSize.width,
                    height: measuredImageSize.height,
                }
                if (isInImage(region, this.lastX, this.lastY, image, this.ctx)) {
                    this.hit = i
                }
            }
        }

        if (this.hit < 0) {
            this.draw(this.ctx, index)
        } else {
            // this.draggingElement =  this.texts[index][this.hit];
            this.draggingElement =
                this.ctx == this.canvases.image[index].getContext('2d') ? this.images[index][this.hit] : this.texts[index][this.hit]
            this.isDown = true;
        }

    }
    handleMouseUp(event, index) {
        this.isDown = false
        this.draw(this.ctx, index)

    }
    selectElement(intersects) {
        if (!this.hoveringInterface || window.innerWidth < 1000) {
            var oldIndex = this.selectedIndex
            this.selectedIndex = this.children.indexOf(this.children.find(child => child.name == intersects[0].object.name))

            const divElement = document.getElementById(intersects[0].object.name)
            // if not mobile
            if (window.innerWidth > 1000) {
                divElement.parentElement.children[1].style.display = divElement.parentElement.children[1].style.display == 'none' ? 'grid' : 'none'
            } else if (!this.gl.placingImage && !this.gl.placingText) {
                selectMaterial(divElement, oldIndex, this.selectedIndex)
            }


        }

    }
}

class WebGL {
    constructor() {
        this.gui = new GUI();
        this.animate = this.animate.bind(this);
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
        this.renderer = new THREE.WebGLRenderer(
            {
                antialias: true,
                alpha: false,
            }
        )

        // this.renderer.toneMapping = THREE.ACESFilmicToneMapping
        // this.renderer.outputEncoding = THREE.sRGBEncoding
        // this.renderer.setClearColor(0xff0000, 0);
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.object = new THREE.Mesh(
            new THREE.BufferGeometry(),
            new THREE.MeshPhysicalMaterial()
        )
        console.log(this.controls);
        this.params = { color: 0x202020, url: 'objects/coffee/pack5.obj' }
        this.canvasTextures = []
        this.children = []
        this.raycaster = new THREE.Raycaster()
        this.mouse = {}
        this.interface = null
        this.isDown = false
        this.intersects = []
        this.lastIntersected = null
        this.autoSpin = false
        this.placingImage = false
        this.placingText = false
        this.textToPlace = null
        this.imageToPlace = null
    }
    init() {
        this.initScene()
        this.animate()
        return this
    }
    initScene() {
        this.mouse = { x: 0, y: 0 }
        this.camera.position.z = 50
        // this.scene.background = new THREE.Color('#202020')
        this.controls.enableDamping = false
        this.controls.dampingFactor = 0.1
        if (window.innerWidth >= 1000) {
            this.controls.enableRotate = false

        }
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.raycaster.setFromCamera(this.mouse, this.camera);
        this.renderer.domElement.id = 'three'
        var container = document.getElementsByClassName('container')[0]
        container.appendChild(this.renderer.domElement);
        this.renderer.autoClear = false


        window.addEventListener('mousemove', (event) => {
            this.onMouseMove(event)
        })
        // touch move
        this.renderer.domElement.addEventListener('touchmove', (event) => {
            this.onTouchMove(event)
        })
        // touch start
        window.addEventListener('touchstart', (event) => {
            this.onTouchStart(event)
        })
        // touch end
        window.addEventListener('touchend', (event) => {
            this.onTouchEnd(event)
        })
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            this.onMouseDown(event)
        })
        window.addEventListener('mouseup', (event) => {
            this.onMouseUp(event)
        })
        // Resize
        window.addEventListener('resize', (e) => {
            this.onResize()
        })

        this.addLights()
        this.initGUI()
    }
    initGUI() {
        this.gui.domElement.id = 'gui'
        var container = document.getElementsByClassName('container')[0]
        container.appendChild(this.gui.domElement);
        const globalFolder = this.gui.addFolder('Global')
        const objectFolder = this.gui.addFolder('Object')
        this.materialFolder = this.gui.addFolder('Material')
        this.scene.background = new THREE.Color('#202020')
        globalFolder.addColor(this.params, 'color').onChange(() => {
            this.onBackgroundColorChange()
        }).name('Background Color')

        this.gui.add(this, 'autoSpin').name('Auto Spin')


        objectFolder.add(this.params, 'url').name('OBJ URL:').onFinishChange(() => {
            this.loadOBJ(this.params.url)
        })
        this.loadOBJ(this.params.url)

        this.gui.add(this.controls, 'enableZoom').name('Enable Zoom');
    }
    addLights() {
        const lightsFolder = this.gui.addFolder('Lights')

        const dirLight = new THREE.DirectionalLight(0xffffff, 1, 0);
        dirLight.position.set(0, 50, 100);
        dirLight.castShadow = true;
        dirLight.shadow.bias = -0.0001;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;

        this.scene.add(dirLight.target)

        // add intensity to global folder
        lightsFolder.add(dirLight, 'intensity', 0, 2, 0.01).name('Light Intensity')
        lightsFolder.add(dirLight.position, 'x', -100, 100, 1).name('Light X')
        lightsFolder.add(dirLight.position, 'y', -100, 100, 1).name('Light Y')
        lightsFolder.add(dirLight.position, 'z', -100, 100, 1).name('Light Z')

        // add light target to gui
        const targetFolder = lightsFolder.addFolder('Light Target')
        targetFolder.add(dirLight.target.position, 'x', -100, 100, 1).name('Target X')
        targetFolder.add(dirLight.target.position, 'y', -100, 100, 1).name('Target Y')
        targetFolder.add(dirLight.target.position, 'z', -100, 100, 1).name('Target Z')




        //set bias to -0.001
        this.scene.add(dirLight);


        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);

        // add ambient light to gui
        lightsFolder.add(ambientLight, 'intensity', 0, 2, 0.01).name('Ambient Light Intensity')
    }
    loadOBJ(url) {
        this.camera.position.x = 0
        this.camera.position.y = 0


        if (this.interface) {
            //delete canvases
            this.interface.canvases.image.forEach(canvas => {
                canvas.parentElement.remove()
            })
            this.interface.canvases.text.forEach(canvas => {
                canvas.parentElement.remove()
            })
            this.interface.colorPickers.forEach(colorPicker => {
                colorPicker.remove()
            })

            this.interface.canvases.image = []
            this.interface.canvases.text = []
            this.interface.images = []
            this.interface.texts = []
            this.interface.canvases = { text: [], image: [] }
            this.interface = null

        }
        var loader = new OBJLoader();
        var mtlLoader = new MTLLoader();
        const path = url;
        mtlLoader.setPath(path.split('/').slice(0, -1).join('/') + '/');

        mtlLoader.load(path.split('/')[path.split('/').length - 1].split('.')[0] + '.mtl', (materials) => {

            materials.preload();

            loader.setMaterials(materials);
            console.log(materials);
            console.log(url);
            loader.load(url, (object) => {
                this.children = []
                this.materialFolder.destroy()
                this.materialFolder = this.gui.addFolder('Material')
                if (this.object.parent) {
                    this.scene.remove(this.object.parent.parent)
                }
                this.object = object
                var canvases = {
                    text: [],
                    image: []
                }
                for (var i = 0; i < this.object.children.length; i++) {
                    var child = this.object.children[i]
                    this.children.push(child)
                    if (child.isMesh) {
                        // to non indexed

                        var canvasTxt, canvasTxt2
                        for (var j = 0; j < 2; j++) {
                            var canvas = document.createElement('canvas')

                            canvas.width = 1
                            canvas.height = 1
                            canvas.id = i.toString()
                            canvas.className = 'drawCanvas'
                            canvas.style.transformOrigin = 'left top'
                            canvas.style.transform = 'scale(' + 1 / canvasResolution + ')'
                            if (j == 0) {
                                canvases.image.push(canvas)
                                canvasTxt2 = new THREE.CanvasTexture(canvas)

                            } else {
                                canvases.text.push(canvas)
                                canvasTxt = new THREE.CanvasTexture(canvas)

                            }
                        }

                        canvasTxt.needsUpdate = true
                        applyMapSettings(canvasTxt)

                        canvasTxt2.needsUpdate = true
                        applyMapSettings(canvasTxt2)
                        this.canvasTextures.push(canvasTxt, canvasTxt2)

                        let geometry = child.geometry;

                        geometry.clearGroups();

                        geometry.addGroup(0, Infinity, 0); // z index 0
                        geometry.addGroup(0, Infinity, 1); // z index 1
                        geometry.addGroup(0, Infinity, 2); // z index 2
                        geometry.addGroup(0, Infinity, 3); // z index 2


                        var currentMat = (materials.materials[child.material.name])
                        console.log(currentMat.shininess);
                        const childStandardMaterial = new THREE.MeshPhysicalMaterial({
                            transparent: false,
                            // alphaTest: 0.5,
                            emissive: currentMat.emissive,
                            emissiveIntensity: currentMat.emissiveIntensity,
                            normalMap: currentMat.normalMap,
                            normalScale: currentMat.normalScale,
                            specularColor: 0xffffff, specularIntensity: 1, color: currentMat.color, map: currentMat.map, roughness: 1 - currentMat.shininess / 100, reflectivity: currentMat.reflectivity, opacity: currentMat.opacity
                        })


                        var clonePhysical = new THREE.MeshPhysicalMaterial().copy(childStandardMaterial)
                        clonePhysical.map = null
                        clonePhysical.alphaTest = 0.5
                        const childMapMaterial = new THREE.MeshPhysicalMaterial().copy(clonePhysical)
                        childMapMaterial.alphaTest = 0.5
                        // childMapMaterial.transparent = true
                        childMapMaterial.opacity = 0

                        const canvasMaterial = new THREE.MeshPhysicalMaterial().copy(clonePhysical)
                        const canvasMaterial2 = new THREE.MeshPhysicalMaterial().copy(clonePhysical)
                        canvasMaterial.color = new THREE.Color(0xffffff)
                        canvasMaterial2.color = new THREE.Color(0xffffff)
                        this.colorMaterial = new THREE.MeshPhysicalMaterial().copy(clonePhysical)

                        child.material = [childStandardMaterial, childMapMaterial, canvasMaterial2, canvasMaterial,]

                        const currentFolder = this.materialFolder.addFolder(child.name)
                        var _this = this;
                        const changedChild = _this.object.children.find(child => child.name == currentFolder.$title.textContent)


                        currentFolder.add(child.material[0], 'metalness', 0, 1, 0.01).name('Metalness').onChange(function () {
                            changedChild.material[1].metalness = changedChild.material[0].metalness
                            changedChild.material[2].metalness = changedChild.material[0].metalness
                            changedChild.material[3].metalness = changedChild.material[0].metalness
                        })

                        // add transparency toggle
                        currentFolder.add(child.material[1], 'transparent').name('Transparent').onChange(function (e) {
                            changedChild.material[0].transparent = e
                            changedChild.material[2].transparent = e
                            changedChild.material[3].transparent = e

                            if (e == true) {
                                //alphatest  0
                                changedChild.material[1].alphaTest = 0
                                changedChild.material[0].alphaTest = 0

                                changedChild.material[2].alphaTest = 0
                                changedChild.material[3].alphaTest = 0

                            } else {
                                changedChild.material[1].alphaTest = 0.5
                                changedChild.material[0].alphaTest = 0.5
                                changedChild.material[2].alphaTest = 0.5
                                changedChild.material[3].alphaTest = 0.5
                            }
                            // needs update
                            changedChild.material[0].needsUpdate = true
                            changedChild.material[1].needsUpdate = true
                            changedChild.material[2].needsUpdate = true
                            changedChild.material[3].needsUpdate = true
                        })


                        currentFolder.add(child.material[0], 'roughness', 0, 1, 0.01).name('Roughness').onChange(function () {

                            changedChild.material[1].roughness = changedChild.material[0].roughness
                            changedChild.material[2].roughness = changedChild.material[0].roughness
                            changedChild.material[3].roughness = changedChild.material[0].roughness

                        })
                        currentFolder.add(child.material[0], 'opacity', 0, 1, 0.01).name('Opacity').onChange(function () {

                            if (changedChild.material[1].map != undefined || changedChild.material[1].opacity != 0) {
                                changedChild.material[1].opacity = changedChild.material[0].opacity
                            }

                            changedChild.material[2].opacity = changedChild.material[0].opacity
                            changedChild.material[3].opacity = changedChild.material[0].opacity

                        })
                        currentFolder.add(child.material[0], 'reflectivity', 0, 1, 0.01).name('Reflectivity').onChange(function () {


                            changedChild.material[1].reflectivity = changedChild.material[0].reflectivity
                            changedChild.material[2].reflectivity = changedChild.material[0].reflectivity
                            changedChild.material[3].reflectivity = changedChild.material[0].reflectivity

                        })
                        currentFolder.add(child.material[0], 'ior', 1.0, 2.333, 0.01).name('Refraction').onChange(function () {

                            changedChild.material[1].ior = changedChild.material[0].ior
                            changedChild.material[2].ior = changedChild.material[0].ior
                            changedChild.material[3].ior = changedChild.material[0].ior

                        })

                        currentFolder.add(child.material[0], 'transmission', 0.0, 1.0, 0.01).name('Transmission').onChange(function () {
                            changedChild.material[1].transmission = changedChild.material[0].transmission
                            changedChild.material[2].transmission = changedChild.material[0].transmission
                            changedChild.material[3].transmission = changedChild.material[0].transmission

                        })

                        currentFolder.add(child.material[0], 'thickness', 0, 10, 0.01).name('Thickness').onChange(function () {
                            changedChild.material[1].thickness = changedChild.material[0].thickness
                            changedChild.material[2].thickness = changedChild.material[0].thickness
                            changedChild.material[3].thickness = changedChild.material[0].thickness

                        })


                        currentFolder.add(child.material[0], 'clearcoat', 0, 1, 0.01).name('ClearCoat').onChange(function () {
                            changedChild.material[1].clearcoat = changedChild.material[0].clearcoat
                            changedChild.material[2].clearcoat = changedChild.material[0].clearcoat
                            changedChild.material[3].clearcoat = changedChild.material[0].clearcoat

                        })

                        currentFolder.add(child.material[0], 'clearcoatRoughness', 0, 1, 0.01).name('ClearCoat Roughness').onChange(function () {
                            changedChild.material[1].clearcoatRoughness = changedChild.material[0].clearcoatRoughness
                            changedChild.material[2].clearcoatRoughness = changedChild.material[0].clearcoatRoughness
                            changedChild.material[3].clearcoatRoughness = changedChild.material[0].clearcoatRoughness

                        })



                        const obj = {
                            url: 'objects/dove/texture5.jpg',
                            normalMap: 'objects/sofa2/sofa2.png',
                            metalnessMap: 'objects/sofa2/sofa2.png',
                            roughnessMap: 'objects/sofa2/sofa2.png',
                            specularMap: 'objects/sofa2/sofa2.png',
                            environmentMap: 'img/grid.jpg',
                            aoMap: 'img/grid.jpg',

                        }
                        currentFolder.add(obj, 'url').name('MATERIAL URL:').onFinishChange(function () {
                            const map = new THREE.TextureLoader().load(obj.url)
                            applyMapSettings(map)
                            changedChild.material[1].map = map
                            changedChild.material[1].needsUpdate = true
                            changedChild.material[1].opacity = 1
                        })
                        currentFolder.add(obj, 'normalMap').name('Normal URL:').onFinishChange(function () {
                            const map = new THREE.TextureLoader().load(obj.normalMap)
                            applyMapSettings(map)
                            changedChild.material[1].normalMap = map
                            changedChild.material[1].normalScale = new THREE.Vector2(1.0, 1.0)
                            changedChild.material[1].needsUpdate = true
                        })
                        currentFolder.add(obj, 'metalnessMap').name('Metalness URL:').onFinishChange(function () {
                            const map = new THREE.TextureLoader().load(obj.metalnessMap)
                            applyMapSettings(map)
                            changedChild.material[1].metalnessMap = map
                            changedChild.material[1].needsUpdate = true
                        })
                        currentFolder.add(obj, 'roughnessMap').name('Roughness URL:').onFinishChange(function () {
                            const map = new THREE.TextureLoader().load(obj.roughnessMap)
                            applyMapSettings(map)
                            changedChild.material[1].roughnessMap = map
                            changedChild.material[1].needsUpdate = true
                        })
                        currentFolder.add(obj, 'specularMap').name('Specular URL:').onFinishChange(function () {
                            const map = new THREE.TextureLoader().load(obj.specularMap)
                            applyMapSettings(map)
                            changedChild.material[1].specularColorMap = map

                            changedChild.material[1].needsUpdate = true

                            changedChild.material[2].specularColorMap = map
                            changedChild.material[2].needsUpdate = true

                            changedChild.material[3].specularColorMap = map
                            changedChild.material[3].needsUpdate = true



                        })
                        var _this = this

                        currentFolder.add(obj, 'environmentMap').name('Environment URL:').onFinishChange(function () {
                            new THREE.TextureLoader().load(obj.environmentMap, (map) => {
                                // _this.scene.background = map
                                applyMapSettings(map)
                                map.mapping = THREE.EquirectangularReflectionMapping
                                var pmrem = new THREE.PMREMGenerator(_this.renderer)
                                pmrem.compileEquirectangularShader()
                                console.log(map);
                                var envMap = pmrem.fromEquirectangular(map).texture
                                changedChild.material[1].envMap = envMap
                                changedChild.material[1].needsUpdate = true
                                changedChild.material[0].envMap = envMap
                                changedChild.material[0].needsUpdate = true
                                changedChild.material[2].envMap = envMap
                                changedChild.material[2].needsUpdate = true
                                changedChild.material[3].envMap = envMap
                                changedChild.material[3].needsUpdate = true

                            })

                        })

                        // add envmapintensity
                        currentFolder.add(changedChild.material[0], 'envMapIntensity', 0, 10, 0.01).name('EnvMap Intensity').onChange(function () {
                            changedChild.material[1].envMapIntensity = changedChild.material[0].envMapIntensity
                            changedChild.material[2].envMapIntensity = changedChild.material[0].envMapIntensity
                            changedChild.material[3].envMapIntensity = changedChild.material[0].envMapIntensity

                        })


                        currentFolder.add(obj, 'aoMap').name('AO URL:').onFinishChange(function () {
                            const map = new THREE.TextureLoader().load(obj.aoMap)
                            applyMapSettings(map)
                            changedChild.geometry.attributes.uv2 = changedChild.geometry.attributes.uv

                            for (var k = 0; k < changedChild.material.length; k++) {
                                console.log(changedChild.material[k], map);
                                changedChild.material[k].aoMap = map
                                changedChild.material[k].aoMapIntensity = 1
                                changedChild.material[k].needsUpdate = true

                            }
                            console.log(changedChild.geometry.attributes);

                        })



                        currentFolder.add(child.material[0], 'specularIntensity', 0, 1, 0.01).name('Specular Intensity').onChange(function () {
                            changedChild.material[1].specularIntensity = changedChild.material[0].specularIntensity
                            changedChild.material[2].specularIntensity = changedChild.material[0].specularIntensity
                            changedChild.material[3].specularIntensity = changedChild.material[0].specularIntensity

                        })
                        currentFolder.addColor(child.material[0], 'specularColor').name('Specular Color').onChange(function () {
                            changedChild.material[1].specularColor = changedChild.material[0].specularColor
                            changedChild.material[2].specularColor = changedChild.material[0].specularColor
                            changedChild.material[3].specularColor = changedChild.material[0].specularColor

                        })

                        currentFolder.close()

                        canvasMaterial.map = canvasTxt
                        canvasMaterial2.map = canvasTxt2
                        child.castShadow = true
                        child.receiveShadow = true

                    }


                }

                var centerGroup = new THREE.Group()
                if (window.innerWidth < 1000) {
                    // move object 1/3 screen up on y
                }
                var box3 = new THREE.Box3().setFromObject(this.object)
                var center = new THREE.Vector3()
                box3.getCenter(center)
                this.object.lookAt(this.camera.position)

                centerGroup.add(this.object)
                centerGroup.position.x = -center.x
                centerGroup.position.y = -center.y
                centerGroup.position.z = -center.z
                // set camera z as far as needed
                this.camera.position.z = box3.getSize(new THREE.Vector3()).length() * 2
                var secondGroup = new THREE.Group()
                secondGroup.add(centerGroup)

                this.scene.add(secondGroup)
                this.interface = new Interface({
                    children: this.object.children,
                    gl: this,
                    canvases: canvases
                }).create()
            })

        })
    }

    updateMaterialColor(e, index) {
        this.object.children[index].material[0].color = new THREE.Color(e)
    }
    onBackgroundColorChange() {
        this.scene.background.set(this.params.color)
    }
    onMouseMove(e) {
        var deltaX = (e.clientX / window.innerWidth) * 2 - 1 - this.mouse.x
        var deltaY = -(e.clientY / window.innerHeight) * 2 + 1 - this.mouse.y

        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        if (this.isDown)
            this.rotateScene(deltaX, deltaY, this.object.parent.parent)
    }
    rotateScene(deltaX, deltaY, object) {
        // rotate on all axes

        var deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                THREE.MathUtils.degToRad(-deltaY * 111),
                THREE.MathUtils.degToRad(deltaX * 111),
                0,
                'XYZ'
            ));
        object.quaternion.multiplyQuaternions(deltaRotationQuaternion, object.quaternion);
        // object.rotation.y += deltaX * 3
        // object.rotation.x += deltaY * 3



    }
    rotateSceneMobile(deltaX, deltaY, object) {
        // object.rotation.y += deltaX * 3
        // object.rotation.x -= deltaY * 3

        var deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                THREE.MathUtils.degToRad(-deltaY * 111),
                THREE.MathUtils.degToRad(deltaX * 111),
                0,
                'XYZ'
            ));
        object.quaternion.multiplyQuaternions(deltaRotationQuaternion, object.quaternion);

    }

    onTouchMove(e) {

        // get delta for mobile
        var deltaX = (e.touches[0].clientX / window.innerWidth) * 2 - 1 - this.mouse.x
        var deltaY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1 - this.mouse.y

        this.mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;

        if (this.interface.isDragging == false && !this.hoveringInterface) {
            this.rotateSceneMobile(deltaX, deltaY, this.object.parent.parent)

        }
        if (this.intersects.length > 0) {
            if (this.interface.isDragging) {
                if (this.interface.hitTexture != -1) {
                    this.interface.dragTexture(this.intersects)
                }
                if (this.interface.hitText != -1) {

                    this.interface.dragText(this.intersects)

                }
            }


        } else {
            this.interface.isDragging = false
        }
    }
    onTouchEnd(e) {
        this.isDown = false
        this.interface.isDragging = false
        this.interface.hitTexture = -1
        this.interface.hitText = -1
        this.controls.enableRotate = false
    }

    onTouchStart(e) {

        this.mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
        this.onTouchMove(e)
        this.checkIntersections()
        this.isDown = true

        if (this.intersects.length > 0) {
            if (!this.placingText) {
            }

            // this.controls.enableRotate = false
            var uvs = this.intersects[0].uv

            var index = this.interface.children.indexOf(this.interface.children.find(child => child.name == this.intersects[0].object.name))

            this.canvas = this.interface.canvases.image[index]
            var canvasText = this.interface.canvases.text[index]
            var textCtx = canvasText.getContext('2d')
            this.ctx = this.canvas.getContext('2d')
            var _this = this

            if (this.placingImage) {

                this.interface.addImageMobile(this.imageToPlace, this.placeOnIndex)
            } else if (this.placingText) {
                this.interface.addTextMobile(this.textToPlace, this.placeOnIndex)
            } else {

                for (var i = 0; i < this.interface.texts[index].length; i++) {
                    var text = this.interface.texts[index][i];
                    var measuredTextSize = textCtx.measureText(text.text)

                    const region = {
                        x: text.x - measuredTextSize.width / 2,
                        y: text.y - measuredTextSize.actualBoundingBoxAscent / 2,
                        width: measuredTextSize.width,
                        height: measuredTextSize.actualBoundingBoxAscent,
                    }

                    console.log(canvasText.width);

                    if (isInText(region, uvs.x * canvasText.width, canvasText.height - uvs.y * canvasText.height, text, textCtx)) {

                        this.interface.hit = i
                        this.interface.hitText = i
                        this.interface.isDragging = true
                        console.log('drag');

                    }
                }
                for (var i = 0; i < this.interface.images[index].length; i++) {
                    var image = this.interface.images[index][i]

                    const region = {
                        x: image.x,
                        y: image.y,
                        width: image.width,
                        height: image.height
                    }

                    if (isInImage(region, uvs.x * this.canvas.width, this.canvas.height - uvs.y * this.canvas.height, image, this.ctx)) {
                        this.interface.hitTexture = i
                        this.interface.hit = i
                        this.interface.isDragging = true

                    }

                }
            }




        }

    }


    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    onMouseDown(e) {
        this.isDown = true
        if (this.intersects.length > 0 && this.hit == -1 && !this.placingText && !this.placingImage) {
            this.interface.selectElement(this.intersects)
        } else {
            this.hit = -1
        }

    }
    onMouseUp(e) {
        this.isDown = false
    }

    checkIntersections() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        this.intersects = this.raycaster.intersectObjects(this.children);
        if (this.intersects.length > 0) {
            if (this.lastIntersected && this.lastIntersected.object != this.intersects[0].object && this.interface.isDragging) {
                this.interface.isDragging = false
            }
            this.lastIntersected = this.intersects[0]
        }
    }
    animate() {
        if (this.autoSpin) {
            this.object.parent.parent.rotation.y += 0.005
        }
        for (var i = 0; i < this.canvasTextures.length; i++) {
            this.canvasTextures[i].needsUpdate = true
        }
        this.checkIntersections()
        requestAnimationFrame(this.animate);
        this.controls.update()
        this.renderer.render(this.scene, this.camera);
    }
}

var gl = new WebGL().init()

/**
 * Utils
 */

const applyMapSettings = (map) => {
    map.flipY = true
    map.wrapS = THREE.RepeatWrapping
    map.wrapT = THREE.RepeatWrapping
    map.repeat.set(1, 1)
    map.minFilter = THREE.LinearFilter
    map.magFilter = THREE.LinearFilter
}

const isInImage = (region, x, y, image, ctx) => {
    // rotate region according to image rotation and scale and minwidth and height and check if point is inside it using context.isPointInPath
    ctx.save()

    ctx.translate(region.x + region.width / 2, region.y + region.height / 2)
    ctx.rotate(image.rotation * Math.PI / 50)
    ctx.translate(-region.x - region.width / 2, -region.y - region.height / 2)

    ctx.beginPath()
    ctx.rect(region.x, region.y, region.width, region.height)
    var isInPath = ctx.isPointInPath(x, y)
    ctx.restore()
    return isInPath
}

const isInText = (region, x, y, text, ctx) => {
    // rotate region according to text rotation and check if point is inside it using context.isPointInPath
    ctx.save()
    ctx.translate(region.x + region.width / 2, region.y + region.height / 2)
    ctx.rotate(text.rotation * Math.PI / 50)
    ctx.translate(-region.x - region.width / 2, -region.y - region.height / 2)
    ctx.beginPath()
    ctx.rect(region.x, region.y, region.width, region.height)
    var isInPath = ctx.isPointInPath(x, y)
    ctx.restore()
    return isInPath
}

const selectMaterial = (elem, oldIndex, newIndex) => {
    elem.style.color = 'red'

    var materialDivs = document.getElementsByClassName('material')
    for (var i = 0; i < materialDivs.length; i++) {
        if (materialDivs[i] != elem) {
            materialDivs[i].style.color = 'white'
        }
    }

    var wasOnImage = false
    var wasOntext = false
    if (gl.interface.imageEditors[oldIndex].style.display == 'block') {

        gl.interface.toggleImageEditor(oldIndex)
        wasOnImage = true
    }
    if (gl.interface.textEditors[oldIndex].style.display == 'block') {
        gl.interface.toggleTextEditor(oldIndex)
        wasOntext = true

    }

    if (wasOnImage) {
        gl.interface.toggleImageEditor(newIndex)

    }
    if (wasOntext) {

        gl.interface.toggleTextEditor(newIndex)
    }

}
