#version 300 es
precision highp float;

in vec4 vColor;
in vec3 vnormal;

uniform vec3 lightdir;
uniform vec3 lightcolor;


uniform vec3 camera_position;
uniform mat4 mv;
uniform mat4 p;

uniform vec4 color;

out vec4 fragColor;


void main() {
    vec3 n = normalize(vnormal); // not sure why I need to normalize?
    // vec3 new_ld = normalize(mat3(mv) * lightdir);
    vec3 h = normalize(lightdir + camera_position);
    float lambert = max(dot(-n, lightdir), 0.0);
    float blinn = max(pow(dot(h, -n), 40.0), 0.0);

    fragColor = vec4(color.rgb * (lightcolor * lambert) + vec3(1,1,1) * blinn * lightcolor, color.a);

    // fragColor = vec4(color.rgb * (lightcolor * lambert + specular_lightcolor * 0.01 * specular_lambert) + vec3(1,1,1) * blinn, color.a);
}
