"use client"

import { useState, useEffect, useCallback } from "react"

export function useTypewriter(fullText: string, speed = 50) {
  const [text, setText] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (!fullText) {
      setText("")
      return
    }

    setIsTyping(true)
    let index = 0
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setText(fullText.substring(0, index + 1))
        index++
      } else {
        setIsTyping(false)
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [fullText, speed])

  const reset = useCallback(() => {
    setText("")
    setIsTyping(false)
  }, [])

  return { text, isTyping, reset }
}
