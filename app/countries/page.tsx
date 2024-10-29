import coordinates, {quantization} from "@/function/coordinates";
import React from "react";

export default function page():React.ReactNode {
	return <>{JSON.stringify(quantization(coordinates("countries")))}</>
}