attribute vec2 a_position;
uniform vec2 u_resolution;
uniform mat3 u_matrix;
varying vec4 v_color;

void main() {
    vec2 zeroToOne = a_position / u_resolution;
    gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
    v_color = gl_Position * 0.5 + 0.5;
}