precision mediump float;

uniform vec4 u_color;

void main() {
    gl_FragColor = vec4(u_color.rgb, 0.5);
}