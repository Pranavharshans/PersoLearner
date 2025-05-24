# Manim API Reference

## Overview

Manim (Mathematical Animation Engine) is a Python library for creating mathematical animations. Originally created by 3Blue1Brown, the community version provides a powerful framework for generating educational videos programmatically.

## Installation

```bash
# Install Manim Community Edition
pip install manim

# Or using conda
conda install -c conda-forge manim

# Verify installation
manim checkhealth
```

## Core Concepts

### 1. Scene Class
The fundamental building block of any Manim animation.

```python
from manim import *

class MyScene(Scene):
    def construct(self):
        # All animation code goes here
        pass
```

### 2. Mobjects (Mathematical Objects)
Everything visible in Manim is a Mobject.

### 3. Animations
Functions that transform Mobjects over time.

### 4. Rendering
Converting the scene into a video file.

---

## Basic Scene Structure

### Simple Scene Template

```python
from manim import *

class BasicScene(Scene):
    def construct(self):
        # Create objects
        circle = Circle()
        square = Square()
        
        # Style objects
        circle.set_fill(BLUE, opacity=0.5)
        square.set_fill(RED, opacity=0.7)
        
        # Position objects
        circle.shift(LEFT * 2)
        square.shift(RIGHT * 2)
        
        # Add to scene
        self.add(circle, square)
        
        # Wait for 2 seconds
        self.wait(2)
```

### Scene with Animations

```python
class AnimatedScene(Scene):
    def construct(self):
        # Create and animate objects
        circle = Circle()
        
        # Show creation animation
        self.play(Create(circle))
        
        # Transform and move
        self.play(
            circle.animate.set_fill(PINK, opacity=0.5),
            circle.animate.shift(UP)
        )
        
        # Fade out
        self.play(FadeOut(circle))
```

---

## Mobjects (Mathematical Objects)

### Basic Shapes

```python
# Geometric shapes
circle = Circle(radius=1, color=BLUE)
square = Square(side_length=2, color=RED)
rectangle = Rectangle(width=3, height=2, color=GREEN)
triangle = Triangle(color=YELLOW)
polygon = Polygon([0, 0, 0], [1, 0, 0], [0.5, 1, 0], color=PURPLE)

# Lines and arrows
line = Line(start=LEFT, end=RIGHT, color=WHITE)
arrow = Arrow(start=LEFT, end=RIGHT, color=ORANGE)
vector = Vector([2, 1, 0], color=PINK)

# Arcs and curves
arc = Arc(radius=1, start_angle=0, angle=PI/2, color=CYAN)
curve = ParametricFunction(
    lambda t: np.array([t, t**2, 0]),
    t_range=[-2, 2],
    color=MAROON
)
```

### Text and LaTeX

```python
# Regular text
text = Text("Hello World", font_size=48, color=WHITE)
text_with_font = Text("Custom Font", font="Arial", font_size=36)

# LaTeX text
latex = Tex(r"\LaTeX", font_size=72, color=BLUE)
math_formula = MathTex(r"E = mc^2", font_size=60, color=GREEN)

# Multi-line LaTeX
equation = MathTex(
    r"\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}",
    font_size=48
)

# LaTeX with multiple parts (for animations)
formula_parts = MathTex(
    "f(x)", "=", "a", "x^2", "+", "b", "x", "+", "c"
)
```

### Mathematical Objects

```python
# Coordinate systems
axes = Axes(
    x_range=[-3, 3, 1],
    y_range=[-2, 2, 1],
    x_length=6,
    y_length=4
)

# Number line
number_line = NumberLine(
    x_range=[-5, 5, 1],
    length=10,
    include_numbers=True
)

# Graphs and functions
graph = axes.plot(lambda x: x**2, color=BLUE)
parametric_graph = axes.plot_parametric_curve(
    lambda t: [t, np.sin(t), 0],
    t_range=[0, 2*PI],
    color=RED
)

# 3D objects
sphere = Sphere(radius=1, color=BLUE)
cube = Cube(side_length=2, color=RED)
cylinder = Cylinder(radius=1, height=2, color=GREEN)
```

---

## Styling Mobjects

### Colors and Fill

```python
# Set colors
circle.set_color(BLUE)
circle.set_fill(RED, opacity=0.5)
circle.set_stroke(GREEN, width=3)

# Gradients
square.set_fill([BLUE, RED], opacity=0.7)  # Gradient fill

# Predefined colors
colors = [RED, ORANGE, YELLOW, GREEN, BLUE, PURPLE, PINK, WHITE, BLACK]
```

### Positioning and Transformation

```python
# Basic positioning
circle.move_to(ORIGIN)
circle.shift(UP * 2 + RIGHT * 3)
circle.next_to(square, DOWN)
circle.align_to(square, LEFT)

# Scaling and rotation
circle.scale(2)
circle.rotate(PI/4)
circle.flip(RIGHT)  # Reflect across vertical axis

# Relative positioning
circle.to_edge(UP)
circle.to_corner(UL)  # Upper left corner
circle.center()
```

---

## Animations

### Basic Animations

```python
# Creation animations
self.play(Create(circle))
self.play(DrawBorderThenFill(square))
self.play(Write(text))
self.play(FadeIn(triangle))

# Transformation animations
self.play(Transform(circle, square))
self.play(ReplacementTransform(circle, square))

# Movement animations
self.play(circle.animate.shift(UP))
self.play(circle.animate.rotate(PI/2))
self.play(circle.animate.scale(2))

# Removal animations
self.play(FadeOut(circle))
self.play(Uncreate(square))
```

### Advanced Animations

```python
# Multiple simultaneous animations
self.play(
    Create(circle),
    Write(text),
    FadeIn(square),
    run_time=2
)

# Sequential animations with different timing
self.play(Create(circle), run_time=1)
self.play(circle.animate.shift(UP), run_time=0.5)
self.play(FadeOut(circle), run_time=1.5)

# Animation with rate functions
from manim import rate_functions as rf

self.play(
    circle.animate.shift(RIGHT * 3),
    rate_func=rf.ease_in_out_cubic,
    run_time=2
)
```

### Custom Animations

```python
class CountAnimation(Animation):
    def __init__(self, number_mob, start, end, **kwargs):
        super().__init__(number_mob, **kwargs)
        self.start = start
        self.end = end

    def interpolate_mobject(self, alpha):
        value = self.start + alpha * (self.end - self.start)
        self.mobject.set_value(value)

# Usage
number = DecimalNumber(0, num_decimal_places=2)
self.play(CountAnimation(number, 0, 100), run_time=3)
```

---

## Scene Management

### Scene Sections

```python
class SectionedScene(Scene):
    def construct(self):
        # First section
        self.next_section("Introduction")
        title = Text("Welcome to Manim")
        self.play(Write(title))
        self.wait(1)
        
        # Second section
        self.next_section("Main Content")
        circle = Circle()
        self.play(Create(circle))
        self.wait(1)
        
        # Skip this section during rendering
        self.next_section("Optional", skip_animations=True)
        self.play(FadeOut(circle))
```

### Camera Control

```python
# Zoom and pan
self.camera.frame.scale(0.5)  # Zoom in
self.camera.frame.shift(UP * 2)  # Pan up

# Animated camera movement
self.play(self.camera.frame.animate.scale(2))
self.play(self.camera.frame.animate.shift(DOWN))
```

---

## Rendering Commands

### Basic Rendering

```bash
# Render with preview (low quality)
manim -pql scene.py SceneName

# High quality render
manim -pqh scene.py SceneName

# Medium quality
manim -pqm scene.py SceneName

# Save as GIF
manim --format gif scene.py SceneName

# Render specific frame
manim -s scene.py SceneName
```

### Advanced Rendering Options

```bash
# Custom resolution
manim --resolution 1920,1080 scene.py SceneName

# Custom frame rate
manim --frame_rate 60 scene.py SceneName

# Transparent background
manim --transparent scene.py SceneName

# Save sections separately
manim --save_sections scene.py SceneName

# Disable caching
manim --disable_caching scene.py SceneName
```

---

## Common Patterns for Educational Videos

### Mathematical Proof Visualization

```python
class ProofVisualization(Scene):
    def construct(self):
        # Title
        title = Text("Pythagorean Theorem", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))
        
        # Create right triangle
        triangle = Polygon(
            [0, 0, 0], [3, 0, 0], [3, 4, 0],
            color=WHITE, fill_opacity=0.3
        )
        
        # Labels
        a_label = MathTex("a").next_to(triangle, DOWN)
        b_label = MathTex("b").next_to(triangle, RIGHT)
        c_label = MathTex("c").move_to(triangle.get_center() + LEFT * 0.5)
        
        # Animate creation
        self.play(Create(triangle))
        self.play(Write(a_label), Write(b_label), Write(c_label))
        
        # Show formula
        formula = MathTex("a^2 + b^2 = c^2")
        formula.to_edge(DOWN)
        self.play(Write(formula))
        
        self.wait(2)
```

### Function Graphing

```python
class FunctionGraph(Scene):
    def construct(self):
        # Create axes
        axes = Axes(
            x_range=[-4, 4, 1],
            y_range=[-2, 8, 1],
            x_length=8,
            y_length=6
        )
        axes_labels = axes.get_axis_labels(x_label="x", y_label="f(x)")
        
        # Create function
        graph = axes.plot(lambda x: x**2, color=BLUE)
        graph_label = MathTex("f(x) = x^2").next_to(graph, UP)
        
        # Animate
        self.play(Create(axes), Write(axes_labels))
        self.play(Create(graph), Write(graph_label))
        
        # Show specific point
        point = Dot(axes.coords_to_point(2, 4), color=RED)
        point_label = MathTex("(2, 4)").next_to(point, UR)
        
        self.play(Create(point), Write(point_label))
        self.wait(2)
```

### Step-by-Step Equation Solving

```python
class EquationSolving(Scene):
    def construct(self):
        # Initial equation
        eq1 = MathTex("2x + 3 = 7")
        self.play(Write(eq1))
        self.wait(1)
        
        # Step 1: Subtract 3
        eq2 = MathTex("2x + 3 - 3 = 7 - 3")
        self.play(Transform(eq1, eq2))
        self.wait(1)
        
        # Step 2: Simplify
        eq3 = MathTex("2x = 4")
        self.play(Transform(eq1, eq3))
        self.wait(1)
        
        # Step 3: Divide by 2
        eq4 = MathTex("x = 2")
        self.play(Transform(eq1, eq4))
        self.wait(2)
```

---

## Code Generation Patterns for LLMs

### Template Structure

```python
# Template for LLM-generated Manim scripts
MANIM_TEMPLATE = """
from manim import *

class {scene_name}(Scene):
    def construct(self):
        # Title section
        title = Text("{title}", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(1)
        
        # Main content
        {main_content}
        
        # Conclusion
        self.wait(2)
        self.play(FadeOut(*self.mobjects))
"""
```

### Common Animation Patterns

```python
# Pattern 1: Text explanation with visual
def create_explanation_scene(topic, explanation_text, visual_elements):
    return f"""
    # Explanation text
    explanation = Text("{explanation_text}", font_size=36)
    explanation.to_edge(DOWN)
    
    # Visual elements
    {visual_elements}
    
    # Animate
    self.play(Write(explanation))
    self.play(Create(visual))
    self.wait(2)
    """

# Pattern 2: Mathematical transformation
def create_math_transformation(initial_expr, steps):
    transformations = []
    for i, step in enumerate(steps):
        transformations.append(f"""
        eq{i+1} = MathTex("{step}")
        self.play(Transform(eq{i}, eq{i+1}))
        self.wait(1)
        """)
    return "\n".join(transformations)

# Pattern 3: Geometric construction
def create_geometric_construction(shapes, labels):
    constructions = []
    for shape, label in zip(shapes, labels):
        constructions.append(f"""
        {shape['name']} = {shape['type']}({shape['params']})
        {label['name']} = Text("{label['text']}").next_to({shape['name']}, {label['position']})
        self.play(Create({shape['name']}), Write({label['name']}))
        """)
    return "\n".join(constructions)
```

### Validation Patterns

```python
def validate_manim_script(script):
    """Validate generated Manim script for safety and correctness"""
    
    # Check for required imports
    if 'from manim import *' not in script and 'import manim' not in script:
        return False, "Missing Manim import"
    
    # Check for Scene class
    if 'class' not in script or 'Scene' not in script:
        return False, "Missing Scene class definition"
    
    # Check for construct method
    if 'def construct(self):' not in script:
        return False, "Missing construct method"
    
    # Security checks - forbidden imports/functions
    forbidden = ['os', 'subprocess', 'sys', 'eval', 'exec', '__import__']
    for item in forbidden:
        if item in script:
            return False, f"Forbidden import/function: {item}"
    
    # Check for basic syntax
    try:
        compile(script, '<string>', 'exec')
    except SyntaxError as e:
        return False, f"Syntax error: {e}"
    
    return True, "Script is valid"
```

---

## Best Practices for Code Generation

### 1. Modular Scene Construction

```python
def generate_intro_section(title):
    return f"""
        # Introduction
        title = Text("{title}", font_size=48, color=BLUE)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(1)
    """

def generate_content_section(content_type, content_data):
    if content_type == "equation":
        return f"""
        equation = MathTex("{content_data['formula']}")
        self.play(Write(equation))
        self.wait(1)
        """
    elif content_type == "graph":
        return f"""
        axes = Axes(x_range={content_data['x_range']}, y_range={content_data['y_range']})
        graph = axes.plot(lambda x: {content_data['function']})
        self.play(Create(axes), Create(graph))
        self.wait(1)
        """

def generate_conclusion_section():
    return """
        # Conclusion
        self.wait(2)
        self.play(FadeOut(*self.mobjects))
    """
```

### 2. Error Handling in Generated Code

```python
def safe_manim_generation(content):
    """Generate Manim code with error handling"""
    try:
        # Generate base structure
        script = MANIM_TEMPLATE.format(
            scene_name="GeneratedScene",
            title=content.get('title', 'Educational Video'),
            main_content=generate_main_content(content)
        )
        
        # Validate script
        is_valid, message = validate_manim_script(script)
        if not is_valid:
            raise ValueError(f"Invalid script: {message}")
        
        return script
        
    except Exception as e:
        # Fallback to simple scene
        return generate_fallback_scene(str(e))

def generate_fallback_scene(error_message):
    """Generate a simple fallback scene when generation fails"""
    return f"""
from manim import *

class FallbackScene(Scene):
    def construct(self):
        error_text = Text("Error generating content", font_size=36, color=RED)
        self.play(Write(error_text))
        self.wait(2)
    """
```

### 3. Content-Specific Templates

```python
# Mathematics template
MATH_TEMPLATE = """
from manim import *

class MathLesson(Scene):
    def construct(self):
        # Title
        title = Text("{title}", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))
        
        # Problem statement
        problem = MathTex("{problem}")
        self.play(Write(problem))
        self.wait(1)
        
        # Solution steps
        {solution_steps}
        
        # Final answer
        answer = MathTex("{answer}", color=GREEN)
        self.play(Write(answer))
        self.wait(2)
"""

# Science template
SCIENCE_TEMPLATE = """
from manim import *

class ScienceLesson(Scene):
    def construct(self):
        # Title
        title = Text("{title}", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))
        
        # Concept explanation
        explanation = Text("{explanation}", font_size=32)
        explanation.to_edge(DOWN)
        
        # Visual demonstration
        {visual_demo}
        
        self.play(Write(explanation))
        self.wait(3)
"""
```

This comprehensive Manim API reference provides the foundation for generating educational videos programmatically, with patterns specifically designed for LLM-based code generation. 