#version 300 es
precision highp float;

in vec4 vColor;
in vec3 vnormal;

uniform vec3 lightdir;
uniform vec3 lightcolor;

uniform vec3 halfway_vector;

uniform vec4 color;
out vec4 fragColor;

void main() {
    vec3 n = normalize(vnormal);
    float lambert = max(dot(-n, lightdir), 0.0);
    float blinn = max(pow(dot(-n, halfway_vector), 70.0), 0.0);
    // float specular_lambert = max(dot(-n, specular_lightdir), 0.0);
    fragColor = vec4(color.rgb * (1.2 * lightcolor * lambert)  + vec3(1,1,1) * blinn, color.a);
}

