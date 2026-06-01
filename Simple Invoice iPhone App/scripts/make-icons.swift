import AppKit
import Foundation

struct IconFile {
  let name: String
  let pixels: Int
}

let outputPath = CommandLine.arguments.dropFirst().first ?? "app/icons"
let outputURL = URL(fileURLWithPath: outputPath)
try FileManager.default.createDirectory(at: outputURL, withIntermediateDirectories: true)

let files = [
  IconFile(name: "favicon-32.png", pixels: 32),
  IconFile(name: "apple-touch-icon.png", pixels: 180),
  IconFile(name: "icon-192.png", pixels: 192),
  IconFile(name: "icon-512.png", pixels: 512),
  IconFile(name: "icon-1024.png", pixels: 1024)
]

for file in files {
  let data = renderIcon(pixels: file.pixels)
  try data.write(to: outputURL.appendingPathComponent(file.name))
}

func renderIcon(pixels: Int) -> Data {
  let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: pixels,
    pixelsHigh: pixels,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
  )!

  let size = CGFloat(pixels)
  let bounds = NSRect(x: 0, y: 0, width: size, height: size)
  let context = NSGraphicsContext(bitmapImageRep: rep)!

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = context
  context.cgContext.setAllowsAntialiasing(true)
  context.cgContext.setShouldAntialias(true)

  NSColor(calibratedRed: 0.93, green: 0.93, blue: 0.9, alpha: 1).setFill()
  bounds.fill()

  let inset = size * 0.08
  let base = NSBezierPath(roundedRect: bounds.insetBy(dx: inset, dy: inset), xRadius: size * 0.16, yRadius: size * 0.16)
  NSColor(calibratedRed: 0.985, green: 0.985, blue: 0.965, alpha: 1).setFill()
  base.fill()

  NSColor(calibratedRed: 0.04, green: 0.04, blue: 0.04, alpha: 1).setStroke()
  base.lineWidth = max(1, size * 0.018)
  base.stroke()

  NSColor(calibratedRed: 1.0, green: 0.08, blue: 0.08, alpha: 1).setFill()
  NSBezierPath(ovalIn: NSRect(x: size * 0.17, y: size * 0.64, width: size * 0.09, height: size * 0.09)).fill()

  let paperRect = NSRect(x: size * 0.3, y: size * 0.18, width: size * 0.48, height: size * 0.64)
  let paper = NSBezierPath(roundedRect: paperRect, xRadius: size * 0.03, yRadius: size * 0.03)
  NSColor.white.setFill()
  paper.fill()

  NSColor(calibratedRed: 1.0, green: 0.08, blue: 0.08, alpha: 1).setFill()
  NSRect(x: paperRect.minX, y: paperRect.maxY - size * 0.09, width: paperRect.width, height: size * 0.045).fill()

  NSColor(calibratedRed: 0.04, green: 0.04, blue: 0.04, alpha: 1).setFill()
  let dot = max(1.1, size * 0.016)
  let gap = dot * 1.75
  let startX = paperRect.minX + size * 0.07
  let startY = paperRect.maxY - size * 0.18

  for row in 0..<4 {
    for column in 0..<8 {
      NSBezierPath(ovalIn: NSRect(
        x: startX + CGFloat(column) * gap,
        y: startY - CGFloat(row) * gap,
        width: dot,
        height: dot
      )).fill()
    }
  }

  NSColor(calibratedWhite: 0.55, alpha: 1).setStroke()
  for index in 0..<4 {
    let y = paperRect.midY - CGFloat(index) * size * 0.07
    let line = NSBezierPath()
    line.move(to: NSPoint(x: paperRect.minX + size * 0.06, y: y))
    line.line(to: NSPoint(x: paperRect.maxX - size * 0.06, y: y))
    line.lineWidth = max(1, size * 0.01)
    line.stroke()
  }

  NSColor(calibratedRed: 1.0, green: 0.08, blue: 0.08, alpha: 1).setFill()
  NSBezierPath(roundedRect: NSRect(
    x: paperRect.maxX - size * 0.18,
    y: paperRect.minY + size * 0.08,
    width: size * 0.11,
    height: size * 0.045
  ), xRadius: size * 0.01, yRadius: size * 0.01).fill()

  NSGraphicsContext.restoreGraphicsState()
  return rep.representation(using: .png, properties: [:])!
}
