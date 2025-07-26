import { useRef, useEffect, useMemo } from "react";
import { gsap } from "gsap";
import logo from "../../assets/logo.png";

const AnimatedFanPie = () => {
  const chartRef = useRef<SVGSVGElement>(null);

  const segments = useMemo(
    () => [
      { label: "Liquidity", value: 40, color: "#2883A3" },
      { label: "Marketing", value: 25, color: "#BD2624" },
      { label: "Future Plans", value: 25, color: "#2CB54A" },
      { label: "Team", value: 10, color: "#631DBE" },
    ],
    []
  );

  const polarToCartesian = (
    cx: number,
    cy: number,
    r: number,
    angle: number
  ) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      `M ${cx} ${cy}`,
      `L ${start.x} ${start.y}`,
      `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
      "Z",
    ].join(" ");
  };

  useEffect(() => {
    const paths = chartRef.current?.querySelectorAll("path.slice");
    const total = segments.reduce((acc, s) => acc + s.value, 0);

    paths?.forEach((path, i) => {
      const seg = segments[i];
      const startAngle =
        (segments.slice(0, i).reduce((a, s) => a + s.value, 0) / total) * 360;
      const sliceAngle = (seg.value / total) * 360;
      const midAngle = startAngle + sliceAngle / 2;

      const rad = (midAngle * Math.PI) / 180;
      const distance = 10;
      const dx = Math.cos(rad) * distance;
      const dy = Math.sin(rad) * distance;

      gsap.fromTo(
        path,
        { transform: "translate(0px, 0px)" },
        {
          transform: `translate(${dx}px, ${dy}px)`,
          duration: 1.2,
          ease: "back.out(1.7)",
          delay: i * 0.1,
        }
      );
    });

    gsap.to("#center", {
      scale: 1.05,
      transformOrigin: "center center",
      repeat: -1,
      yoyo: true,
      duration: 1.5,
      ease: "power1.inOut",
    });

    // Spin on intersection
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.fromTo(
              chartRef.current,
              { rotate: 0 },
              {
                rotate: 360,
                duration: 5,
                ease: "power2.inOut",
                transformOrigin: "center center",
              }
            );
          }
        });
      },
      { threshold: 0.4 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => observer.disconnect();
  }, [segments]);

  let cumulativeAngle = 0;
  const radius = 100;
  const cx = 150;
  const cy = 150;

  return (
    <svg ref={chartRef} width="500" height="500" viewBox="0 0 300 300">
      {/* Pie Slices */}
      {segments.map((seg, i) => {
        const total = segments.reduce((acc, s) => acc + s.value, 0);
        const rawStartAngle = cumulativeAngle;
        const rawEndAngle = cumulativeAngle + (seg.value / total) * 360;
        const startAngle = rawStartAngle - 5; // overlap backward
        const endAngle = rawEndAngle + 5; // overlap forward
        cumulativeAngle = rawEndAngle;

        return (
          <path
            key={i}
            className="slice"
            d={describeArc(cx, cy, radius, startAngle, endAngle)}
            fill={seg.color}
          />
        );
      })}

      {/* Center Circle */}
      <circle id="center" cx={cx} cy={cy} r="30" fill="#0B132B" />

      {/* Logo in Center */}
      <image
        href={logo}
        x={cx - 15}
        y={cy - 15}
        width="30"
        height="30"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
};

export default AnimatedFanPie;
