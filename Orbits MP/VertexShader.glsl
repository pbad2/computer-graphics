#version 300 es
#pragma vscode_glsllint_stage: vert

layout(location=0) in vec4 position;
layout(location=1) in vec4 color;

uniform mat4 mv;
uniform mat4 p;
uniform float seconds;

out vec4 vColor;

void main() {
    vColor = color;
    gl_Position = p * mv * position;

}