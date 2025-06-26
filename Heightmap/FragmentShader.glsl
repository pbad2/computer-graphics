#version 300 es
precision highp float;

in vec4 vColor;
in vec3 vnormal;
in float vHeight;

uniform vec3 lightdir;
uniform vec3 lightcolor;
uniform vec3 halfway_vector;
uniform float maxHeight;
uniform float minHeight;

//uniform vec4 color;
out vec4 fragColor;

vec4 heightToColor(float height, float minHeight, float maxHeight) {
    vec3 colors[8];
    colors[0] = vec3(0.0, 0.0, 1.0); // blue
    colors[1] = vec3(0.0, 1.0, 1.0); // cyan
    colors[2] = vec3(1.0, 1.0, 0.0); // yellow
    colors[3] = vec3(0.0, 1.0, 0.0); // green
    colors[4] = vec3(1.0, 0.0, 0.0); // red
    colors[5] = vec3(1.0, 0.5, 0.0); // orange
    colors[6] = vec3(0.75, 0.0, 0.75); // violet
    colors[7] = vec3(0.5, 0.0, 0.5); // indigo

    height = clamp(height, minHeight, maxHeight);
    float t = (height - minHeight) / (maxHeight - minHeight);
    int colorIndex = int(t * 7.0);
    vec3 color = mix(colors[colorIndex], colors[colorIndex + 1], fract(t * 7.0));
    
    return vec4(color, 1.0);
}
  
   
void main() { 
    vec3 n = normalize(vnormal);
    float steepness  = dot(-n , vec3(0.0, 1.0, 0.0));
    vec4 icolor = heightToColor(vHeight, minHeight, maxHeight);
    float lambert = max(dot(-n, lightdir), 0.0);
    float blinn = pow(max(dot(-n, halfway_vector), 0.0), 40.0);
    fragColor = vec4(icolor.rgb * (lightcolor * lambert)  + vec3(1,1,1) * blinn, icolor.a);
}
