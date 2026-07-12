import gsap from "gsap"
import { useGSAP } from "@gsap/react"

const GsapFromTo = () => {
  // TODO: Implement the gsap.fromTo() method
  useGSAP(() => {
    gsap.fromTo("#red-box", {
      x: 0,
      duration: 2,
      borderRadius: "0%",
    }, {
      x: 250,
      duration: 2,
      rotation: 360,
      yoyo: true,
      repeat: -1,
      borderRadius: "100%",
      scale: 1.5,
      backgroundColor: "#ff0000",
      ease: "power1.inOut",
    })
  })

  return (
    <main>
      <h1>GsapFromTo</h1>

      <p className="mt-5 text-gray-500">
        The <code>gsap.fromTo()</code> method is used to animate elements from a new state to a new state.
      </p>

      <p className="mt-5 text-gray-500">
        The <code>gsap.fromTo()</code> method is similar to the <code>gsap.from()</code> and{" "}
        <code>gsap.to()</code> methods, but the difference is that the <code>gsap.fromTo()</code> method
        animates elements from a new state to a new state, while the <code>gsap.from()</code> method animates
        elements from a new state to their current state, and the <code>gsap.to()</code> method animates
        elements from their current state to a new state.
      </p>

      <p className="mt-5 text-gray-500">
        Read more about the{" "}
        <a
          href="https://greensock.com/docs/v3/GSAP/gsap.fromTo()"
          target="_blank"
          rel="noreferrer noopener nofollow"
        >
          gsap.fromTo()
        </a>{" "}
        method.
      </p>

      <div className="mt-20">
        <div id="red-box" className="w-20 h-20 bg-red-500 rounded-lg" />
      </div>
    </main>
  )
}

export default GsapFromTo
