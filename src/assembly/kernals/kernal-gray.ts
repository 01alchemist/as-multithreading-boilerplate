export function grayScale(pixels:Uint8Array, offsetX:i32, offsetY:i32, width:i32, height:i32):void {
  for(var y = offsetY; y < offsetY + height; y++){
      for(var x = offsetX; x < offsetX + width; x++){
          var i = (y * 4) * (offsetX + width) + x * 4;
          var avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
          pixels[i] = avg;
          pixels[i + 1] = avg;
          pixels[i + 2] = avg;
      }
  }
}
