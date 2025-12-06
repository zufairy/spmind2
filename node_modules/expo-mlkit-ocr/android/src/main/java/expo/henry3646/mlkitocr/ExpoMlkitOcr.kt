package expo.henry3646.mlkitocr

import android.graphics.Point
import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.exception.CodedException
import com.google.android.gms.tasks.OnFailureListener
import com.google.android.gms.tasks.OnSuccessListener
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.TextRecognizer
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.IOException

class ExpoMlkitOcr : Module() {
    
    override fun definition() = ModuleDefinition {
        Name("ExpoMlkitOcr")
        
        AsyncFunction("recognizeText") { imageUriString: String, promise: Promise ->
            try {
                val imageUri = Uri.parse(imageUriString)
                if (imageUri?.path == null) {
                    promise.reject(CodedException("INVALID_URI", "Invalid image URI received: $imageUriString", null))
                    return@AsyncFunction
                }
                
                val image = try {
                    InputImage.fromFilePath(appContext.reactContext ?: throw Exception("Context not available"), imageUri)
                } catch (e: IOException) {
                    promise.reject(CodedException("ERROR_LOADING_IMAGE", "Failed to load image: ${e.message}", e))
                    return@AsyncFunction
                } catch (e: IllegalArgumentException) {
                    promise.reject(CodedException("INVALID_FILE_PATH", "Invalid file path from URI: ${e.message}", e))
                    return@AsyncFunction
                }
                
                val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
                
                recognizer.process(image)
                    .addOnSuccessListener(OnSuccessListener<Text> { visionText ->
                        val result = convertMlKitTextToMap(visionText)
                        promise.resolve(result)
                    })
                    .addOnFailureListener(OnFailureListener { e ->
                        promise.reject(CodedException("ERROR_PROCESSING_IMAGE", "Failed to process image: ${e.message}", e))
                    })
                    
            } catch (e: Exception) {
                promise.reject(CodedException("GENERAL_ERROR", "An unexpected error occurred: ${e.message}", e))
            }
        }
    }
    
    private fun convertMlKitTextToMap(visionText: Text?): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        if (visionText == null) return map
        
        map["text"] = visionText.text
        map["blocks"] = convertMlKitBlocksToList(visionText.textBlocks)
        return map
    }
    
    private fun convertMlKitBlocksToList(blocks: List<Text.TextBlock>?): List<Map<String, Any>> {
        if (blocks == null) return emptyList()
        
        return blocks.mapNotNull { block ->
            block?.let { convertMlKitBlockToMap(it) }
        }
    }
    
    private fun convertMlKitBlockToMap(block: Text.TextBlock): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        
        map["text"] = block.text
        map["lines"] = convertMlKitLinesToList(block.lines)
        map["cornerPoints"] = convertPointsToList(block.cornerPoints)
        return map
    }
    
    private fun convertMlKitLinesToList(lines: List<Text.Line>?): List<Map<String, Any>> {
        if (lines == null) return emptyList()
        
        return lines.mapNotNull { line ->
            line?.let { convertMlKitLineToMap(it) }
        }
    }
    
    private fun convertMlKitLineToMap(line: Text.Line): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        
        map["text"] = line.text
        map["elements"] = convertMlKitElementsToList(line.elements)
        map["cornerPoints"] = convertPointsToList(line.cornerPoints)
        return map
    }
    
    private fun convertMlKitElementsToList(elements: List<Text.Element>?): List<Map<String, Any>> {
        if (elements == null) return emptyList()
        
        return elements.mapNotNull { element ->
            element?.let { convertMlKitElementToMap(it) }
        }
    }
    
    private fun convertMlKitElementToMap(element: Text.Element): Map<String, Any> {
        val map = mutableMapOf<String, Any>()
        
        map["text"] = element.text
        map["cornerPoints"] = convertPointsToList(element.cornerPoints)
        return map
    }
    
    private fun convertPointsToList(points: Array<Point>?): List<Map<String, Int>> {
        if (points == null) return emptyList()
        
        return points.mapNotNull { point ->
            point?.let {
                mapOf(
                    "x" to it.x,
                    "y" to it.y
                )
            }
        }
    }
} 