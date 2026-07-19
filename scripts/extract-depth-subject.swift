#!/usr/bin/env swift

import AppKit
import CoreImage
import Vision

enum ExtractionError: Error, CustomStringConvertible {
  case usage
  case unreadableImage(String)
  case noForeground

  var description: String {
    switch self {
    case .usage:
      return "Usage: extract-depth-subject.swift <input-image> <output-directory>"
    case .unreadableImage(let path):
      return "Could not read image at \(path)"
    case .noForeground:
      return "Vision did not find a foreground instance"
    }
  }
}

func writePNG(_ image: CIImage, to url: URL, context: CIContext) throws {
  let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
  try context.writePNGRepresentation(
    of: image,
    to: url,
    format: .RGBA8,
    colorSpace: colorSpace
  )
}

do {
  guard CommandLine.arguments.count == 3 else { throw ExtractionError.usage }

  let inputPath = CommandLine.arguments[1]
  let outputDirectory = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
  try FileManager.default.createDirectory(
    at: outputDirectory,
    withIntermediateDirectories: true
  )

  guard let source = CIImage(
    contentsOf: URL(fileURLWithPath: inputPath),
    options: [.applyOrientationProperty: true]
  ) else {
    throw ExtractionError.unreadableImage(inputPath)
  }

  let request = VNGenerateForegroundInstanceMaskRequest()
  let handler = VNImageRequestHandler(ciImage: source)
  try handler.perform([request])

  guard let observation = request.results?.first,
        !observation.allInstances.isEmpty else {
    throw ExtractionError.noForeground
  }

  let context = CIContext(options: [.cacheIntermediates: false])
  let transparent = CIImage(color: .clear).cropped(to: source.extent)

  func composite(instances: IndexSet) throws -> CIImage {
    let pixelBuffer = try observation.generateScaledMaskForImage(
      forInstances: instances,
      from: handler
    )
    let mask = CIImage(cvPixelBuffer: pixelBuffer)
    return source.applyingFilter(
      "CIBlendWithMask",
      parameters: [
        kCIInputBackgroundImageKey: transparent,
        kCIInputMaskImageKey: mask,
      ]
    )
  }

  let allURL = outputDirectory.appendingPathComponent("subject-all.png")
  try writePNG(try composite(instances: observation.allInstances), to: allURL, context: context)

  for instance in observation.allInstances {
    let outputURL = outputDirectory.appendingPathComponent("subject-\(instance).png")
    try writePNG(
      try composite(instances: IndexSet(integer: instance)),
      to: outputURL,
      context: context
    )
  }

  print("instances=\(observation.allInstances.count)")
  print("all=\(allURL.path)")
} catch {
  FileHandle.standardError.write(Data("\(error)\n".utf8))
  exit(1)
}
