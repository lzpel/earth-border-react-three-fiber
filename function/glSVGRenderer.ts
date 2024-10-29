import {SVGRenderer} from 'three/addons/renderers/SVGRenderer.js';
const glSVGRenderer = (canvas: HTMLCanvasElement | OffscreenCanvas) => {
	const gl = new SVGRenderer()
	if ("parentNode" in canvas) {
		const parent = canvas.parentNode
		if (parent) {
			parent.removeChild(canvas)
			parent.appendChild(gl.domElement)
		}
	}
	return gl
}
export default glSVGRenderer