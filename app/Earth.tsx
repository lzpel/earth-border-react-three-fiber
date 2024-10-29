"use client"
import React, {useRef} from 'react'
import {useFrame, useThree} from '@react-three/fiber'
import * as topojson from "topojson-client"
import atlas from "world-atlas/countries-50m.json"
import * as THREE from 'three'

function convertVertex(latitude: number, longitude: number) {
	const lambda = latitude * Math.PI / 180, phi = longitude * Math.PI / 180
	return [
		Math.cos(phi) * Math.sin(lambda),
		Math.sin(phi),
		Math.cos(phi) * Math.cos(lambda),
	];
}

export default function Earth(props: {
	radius: number
	lineMaterial: React.ReactNode
}) {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	const country = topojson.mesh(atlas, atlas.objects.countries).coordinates
	const country_v = country.map(v => v.map(v => convertVertex(v[0], v[1])))
	const global_v = new Float32Array(country_v.flat(2))
	const indices = country.map(v => v.length).map((v, i, a) => {
		const offset = a.slice(0, i).reduce((a, b) => a + b, 0)
		return [...Array(v - 1)].map((_, i) => [offset + i, offset + i + 1])
	}).flat()
	const global_i = new Uint32Array(indices.flat())
	//Material with color = 'white' is not white https://github.com/pmndrs/react-three-fiber/discussions/1290#discussioncomment-668649
	//使いたい　https://github.com/spite/THREE.MeshLine?tab=readme-ov-file
	return (
		<>
			<lineSegments scale={props.radius}>
				<bufferGeometry>
					<bufferAttribute
						attach='attributes-position'
						array={global_v}
						count={global_v.length / 3}
						itemSize={3}
					/>
					<bufferAttribute
						attach='index'
						array={global_i}
						count={global_i.length}
						itemSize={1}
					/>
				</bufferGeometry>
				{props.lineMaterial}
			</lineSegments>
			<Horizon
				radius={props.radius}
				lineMaterial={props.lineMaterial}
			/>
		</>
	);
}
const Horizon = (props: {
	radius: number,
	lineMaterial: React.ReactNode
}) => {
	const ref = useRef<THREE.Group>(null);
	const three = useThree();
	useFrame((state) => {
		if (ref.current) {
			const camera_to_object = ref.current.position.clone().sub(state.camera.position)
			const angle_cos = Math.min(props.radius / camera_to_object.length(), 1)
			const angle_sin = Math.sqrt(1 - angle_cos * angle_cos)
			ref.current.scale.set(props.radius * angle_sin, props.radius * angle_sin, props.radius * angle_cos)
			ref.current.lookAt(state.camera.position);
		}
	})
	const size = 60
	const circle_vector = [[0, 0, 0], ...[...Array(size)].map((_, i, a) => i / a.length * 2 * Math.PI).map(v => [Math.cos(v), Math.sin(v), 1])]
	const line_index = [...Array(size)].map((_, i, a) => [i + 1, (i + 1) % a.length + 1]).flat()
	const face_index = [...Array(size)].map((_, i, a) => [0, i + 1, (i + 1) % a.length + 1]).flat()
	return <group ref={ref}>
		<mesh>
			<bufferGeometry>
				<bufferAttribute
					attach='attributes-position'
					array={new Float32Array(circle_vector.flat())}
					count={circle_vector.length}
					itemSize={3}
				/>
				<bufferAttribute
					attach='index'
					array={new Uint32Array(face_index)}
					count={face_index.length}
					itemSize={1}
				/>
			</bufferGeometry>
			{(three.scene.background instanceof THREE.Color) &&
				<meshBasicMaterial color={three.scene.background} side={2}/>}
		</mesh>
		<lineSegments>
			<bufferGeometry>
				<bufferAttribute
					attach='attributes-position'
					array={new Float32Array(circle_vector.flat())}
					count={circle_vector.length}
					itemSize={3}
				/>
				<bufferAttribute
					attach='index'
					array={new Uint32Array(line_index)}
					count={line_index.length}
					itemSize={1}
				/>
			</bufferGeometry>
			{props.lineMaterial}
		</lineSegments>
	</group>
}