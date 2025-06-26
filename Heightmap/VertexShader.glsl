#version 300 es

layout(location=0) in vec4 position;
layout(location=1) in vec4 color;
layout(location=2) in vec3 normal;

uniform mat4 mv;
uniform mat4 p;
uniform float seconds;

out vec4 vColor;
out vec3 vnormal;
out float vHeight;

void main() {
    vColor = color;
    gl_Position = p * mv * position;
    vnormal = mat3(mv) * normal;
    vHeight = position.z;
}