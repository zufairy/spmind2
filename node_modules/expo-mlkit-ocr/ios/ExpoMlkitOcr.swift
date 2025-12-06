import ExpoModulesCore
import Vision
import UIKit

public class ExpoMlkitOcr: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoMlkitOcr")

        AsyncFunction("recognizeText") { (imageUriString: String, promise: Promise) in
            guard let url = URL(string: imageUriString) else {
                promise.reject("INVALID_URI", "Invalid image URI received: \(imageUriString)")
                return
            }
            
            do {
                let imageData = try Data(contentsOf: url)
                guard let image = UIImage(data: imageData), let cgImage = image.cgImage else {
                    promise.reject("INVALID_IMAGE", "Could not load image from URI")
                    return
                }
                
                let requestHandler = VNImageRequestHandler(cgImage: cgImage)
                let request = VNRecognizeTextRequest { (request, error) in
                    if let error = error {
                        promise.reject("VISION_ERROR", "Vision request failed: \(error.localizedDescription)")
                        return
                    }
                    
                    guard let observations = request.results as? [VNRecognizedTextObservation] else {
                        promise.resolve(self.createEmptyResult())
                        return
                    }
                    
                    let result = self.convertVisionTextToMap(observations: observations, imageSize: CGSize(width: cgImage.width, height: cgImage.height))
                    promise.resolve(result)
                }
                
                // Configure for best accuracy and detailed recognition
                request.recognitionLevel = .accurate
                request.usesLanguageCorrection = true
                
                try requestHandler.perform([request])
            } catch {
                promise.reject("FILE_ERROR", "Failed to load image file: \(error.localizedDescription)")
            }
        }
    }
    
    private func createEmptyResult() -> [String: Any] {
        return [
            "text": "",
            "blocks": []
        ]
    }
    
    private func convertVisionTextToMap(observations: [VNRecognizedTextObservation], imageSize: CGSize) -> [String: Any] {
        let allTexts = observations.compactMap { observation in
            observation.topCandidates(1).first?.string
        }
        
        let completeText = allTexts.joined(separator: " ")
        
        // Group observations into blocks based on vertical proximity
        let blocks = groupObservationsIntoBlocks(observations: observations, imageSize: imageSize)
        
        return [
            "text": completeText,
            "blocks": blocks
        ]
    }
    
    private func groupObservationsIntoBlocks(observations: [VNRecognizedTextObservation], imageSize: CGSize) -> [[String: Any]] {
        var blocks: [[String: Any]] = []
        
        // Sort observations by Y position (top to bottom), then by X position (left to right)
        let sortedObservations = observations.sorted { obs1, obs2 in
            let rect1 = obs1.boundingBox
            let rect2 = obs2.boundingBox
            // Vision uses bottom-left origin, so we invert Y for comparison
            let y1 = 1.0 - rect1.origin.y
            let y2 = 1.0 - rect2.origin.y
            
            if abs(y1 - y2) < 0.02 {
                return rect1.origin.x < rect2.origin.x
            }
            return y1 < y2
        }
        
        var currentBlockObservations: [VNRecognizedTextObservation] = []
        var lastY: CGFloat = -1
        
        for observation in sortedObservations {
            let currentY = 1.0 - observation.boundingBox.origin.y // Convert to top-left origin
            
            // If this is far enough from the last line, start a new block
            if lastY != -1 && abs(currentY - lastY) > 0.05 && !currentBlockObservations.isEmpty {
                blocks.append(convertObservationsToBlock(observations: currentBlockObservations, imageSize: imageSize))
                currentBlockObservations = []
            }
            
            currentBlockObservations.append(observation)
            lastY = currentY
        }
        
        // Add the last block
        if !currentBlockObservations.isEmpty {
            blocks.append(convertObservationsToBlock(observations: currentBlockObservations, imageSize: imageSize))
        }
        
        return blocks
    }
    
    private func convertObservationsToBlock(observations: [VNRecognizedTextObservation], imageSize: CGSize) -> [String: Any] {
        let blockTexts = observations.compactMap { observation in
            observation.topCandidates(1).first?.string
        }
        let blockText = blockTexts.joined(separator: " ")
        
        // Convert each observation to a line
        let lines = observations.map { observation in
            convertObservationToLine(observation: observation, imageSize: imageSize)
        }
        
        // Calculate block corner points from all observations
        let cornerPoints = calculateBlockCornerPoints(observations: observations, imageSize: imageSize)
        
        return [
            "text": blockText,
            "lines": lines,
            "cornerPoints": cornerPoints
        ]
    }
    
    private func convertObservationToLine(observation: VNRecognizedTextObservation, imageSize: CGSize) -> [String: Any] {
        let lineText = observation.topCandidates(1).first?.string ?? ""
        
        // For Vision framework, each observation represents a line
        // We'll treat the entire line as a single element since Vision doesn't provide word-level segmentation by default
        let elements = [[
            "text": lineText,
            "cornerPoints": convertBoundingBoxToCornerPoints(boundingBox: observation.boundingBox, imageSize: imageSize)
        ]]
        
        return [
            "text": lineText,
            "elements": elements,
            "cornerPoints": convertBoundingBoxToCornerPoints(boundingBox: observation.boundingBox, imageSize: imageSize)
        ]
    }
    
    private func convertBoundingBoxToCornerPoints(boundingBox: CGRect, imageSize: CGSize) -> [[String: Int]] {
        // Vision framework uses normalized coordinates (0-1) with bottom-left origin
        // Convert to image coordinates with top-left origin to match Android behavior
        
        let imageWidth = imageSize.width
        let imageHeight = imageSize.height
        
        // Convert from Vision's bottom-left origin to top-left origin
        let topLeftX = boundingBox.origin.x * imageWidth
        let topLeftY = (1.0 - (boundingBox.origin.y + boundingBox.height)) * imageHeight
        
        let topRightX = (boundingBox.origin.x + boundingBox.width) * imageWidth
        let topRightY = topLeftY
        
        let bottomRightX = topRightX
        let bottomRightY = (1.0 - boundingBox.origin.y) * imageHeight
        
        let bottomLeftX = topLeftX
        let bottomLeftY = bottomRightY
        
        return [
            ["x": Int(topLeftX), "y": Int(topLeftY)],
            ["x": Int(topRightX), "y": Int(topRightY)],
            ["x": Int(bottomRightX), "y": Int(bottomRightY)],
            ["x": Int(bottomLeftX), "y": Int(bottomLeftY)]
        ]
    }
    
    private func calculateBlockCornerPoints(observations: [VNRecognizedTextObservation], imageSize: CGSize) -> [[String: Int]] {
        guard !observations.isEmpty else { return [] }
        
        // Find the bounding box that encompasses all observations in the block
        var minX: CGFloat = 1.0
        var maxX: CGFloat = 0.0
        var minY: CGFloat = 1.0
        var maxY: CGFloat = 0.0
        
        for observation in observations {
            let box = observation.boundingBox
            minX = min(minX, box.origin.x)
            maxX = max(maxX, box.origin.x + box.width)
            minY = min(minY, box.origin.y)
            maxY = max(maxY, box.origin.y + box.height)
        }
        
        let combinedBoundingBox = CGRect(x: minX, y: minY, width: maxX - minX, height: maxY - minY)
        return convertBoundingBoxToCornerPoints(boundingBox: combinedBoundingBox, imageSize: imageSize)
    }
}
