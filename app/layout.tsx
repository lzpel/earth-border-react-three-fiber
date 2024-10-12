import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "earth-border-react-three-fiber",
    description: "created by lzpel",
};

export default function RootLayout({children,}: Readonly<{ children: React.ReactNode; }>) {
    const full={width: "100%", height: "100%", margin:0}
    return (
        <html style={full}>
        <body style={full}>
        {children}
        </body>
        </html>
    );
}
