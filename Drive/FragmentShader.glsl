#version 300 es
precision highp float;

in vec4 vColor;
in vec3 vnormal;
in vec3 vWorldPosition;

uniform vec3 lightdir;
uniform vec3 lightcolor;
uniform vec3 eyePosition;

uniform vec4 color;
out vec4 fragColor;

void main() {
    vec3 n = normalize(vnormal);

    vec3 eyeDirection = normalize(eyePosition - vWorldPosition);
    vec3 halfwayVec = normalize(lightdir + eyeDirection);
    float lambert = max(dot(-n, lightdir), 0.0);
    float blinn = max(pow(dot(-n, halfwayVec), 55.0), 0.0);
    fragColor = vec4(color.rgb * (lightcolor * lambert)  + vec3(1,1,1) * blinn, color.a);
}
