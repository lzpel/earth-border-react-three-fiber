import React from "react";
import convLatLng from "@/function/convLatLng";
import {Color} from "three";
import RandomXorShift from "@/function/randomXorShift";

const colors = [
	0xed6a5a,
	0xf4f1bb,
	0x9bc1bc,
	0x5ca4a9,
	0xe6ebe0,
	0xf0b67f,
	0xfe5f55,
	0xd6d1b1,
	0xc7efcf,
	0xeef5db,
	0x50514f,
	0xf25f5c,
	0xffe066,
	0x247ba0,
	0x70c1b3
];
const dimention=[0, 1, 2]
const Line = (props: {
	latitude: number,
	longitude: number,
	seed: number,
}) => {
	const r= new RandomXorShift(props.seed*1000)
	const x = [...Array(4)].map(()=>r.nextFloat()-0.5)
	console.log(x)
	const pos_random = 3
	const from_random = 20
	const pos = convLatLng(
		props.latitude + pos_random * x[0],
		props.longitude + pos_random * x[1]
	)
	const from = convLatLng(
		props.latitude + from_random * x[0] + pos_random * x[2],
		props.longitude + from_random * x[1] + pos_random * x[3]
	)
	const rate = [...Array(20)].map((_, i, a) => i / (a.length - 1))
	const h_random = r.nextFloat() * 0.05
	const color = new Color(colors[r.nextInt(0, colors.length)])
	const fourier_coeff = [...Array(2)].map(()=>dimention.map(()=>(r.nextFloat()-0.5)*0.01))
	const points = rate.map(r => {
		const h = 1 + (4 * r * (1 - r)) * h_random
		const p = dimention.map(i => (pos[i] * r + from[i] * (1 - r)) * h)
		fourier_coeff.forEach((v,i)=>{
			for(const d of dimention){
				p[d]+=Math.sin(Math.PI*r*(i+1))*v[d]
			}
		})
		return p
	})
	const index = rate.map((_, i) => [i, i + 1]).slice(0, -1).flat()
	return <lineSegments>
		<bufferGeometry>
			<bufferAttribute
				attach='attributes-position'
				array={new Float32Array(points.flat())}
				count={points.length}
				itemSize={3}
			/>
			<bufferAttribute
				attach='index'
				array={new Uint32Array(index)}
				count={index.length}
				itemSize={1}
			/>
		</bufferGeometry>
		<lineBasicMaterial color={color} linewidth={2}/>
	</lineSegments>
}

export default Line