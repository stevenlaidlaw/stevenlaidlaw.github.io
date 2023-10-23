# Creating a Widget Wrapper with React's createPortal

React is pretty sweet. It works in a nested, hierarchical way&mdash;which is awesome in most cases&mdash;but sometimes that can cause issues. Sometimes you need something to jump out of the parent container, like a modal dialog or a menu. This is precisely what React's `createPortal` is used for!

The problem you'll run into though is that when creating a menu or other kind of dropdown, you need to be aware of the parent container's location and display the floating element appropriately positioned on the page. We also need to make sure that we don't fall outside the bounds of the page.

So, without any further ado, let's create a wrapper that we can use for any kind of dropdown we'd ever need!

## The Setup

First lets create a dumb use-case that will enable us to use this wrapper. We'll build a wide help button that shows a tooltip and stick it in various locations around the page.

[This code](https://gist.github.com/stevenlaidlaw/bc8e85166194340c69282e0ae6e46e39) gives us the following page, with all the info panels toggled on:

![Info Pane Bad](/images/react-widget-portal-0.png)

As you can see the info boxes are currently trapped inside the container, so what we want to do is break it out of the regular DOM hierarchy.

## The Basic Widget

First let's create the most basic version of the widget. This should render whatever children we pass in using the `createPortal` method.

```jsx
class WidgetPortal extends React.Component {
	constructor(props) {
		super(props);
		// Grab the document root to append the modal to it
		this.documentRoot = document.getElementById('root') || document.body;

		// Create the modal Element
		this.el = document.createElement('div');
		this.el.style.zIndex = '10000';
		this.el.style.position = 'absolute';
	}

	componentDidMount() {
		this.documentRoot.appendChild(this.el);
	}

	render() {
		return ReactDOM.createPortal(this.props.children, this.el);
	}
}
```

As you can see in the constructor we first get the root element, then create the modal element using `document.createElement`. After the component has mounted we then append the element to the root element. In the render method we then use the `ReactDOM.createPortal` method. This takes two arguments &mdash; first the child you'd like to render and next the container element to render to. Here we pass in the children and the element we created earlier.

We can now use this WidgetPortal to wrap the notes portion of our original code.

```jsx
<WidgetPortal>
	<div className="info" onClick={this.onToggle}>
		This is the tooltip for {label}
	</div>
</WidgetPortal>
```

And we get the following result:

![Info Pane Better](/images/react-widget-portal-1.png)

This is better, but still isn't 100% correct and is quite buggy. We can see the whole tooltip now, but it's always up in the top left of the screen and all the tooltips overlap each other. Let's work on first getting the tooltips to sit themselves underneath the buttons like you'd expect.

## Widget Portal Improved

First we need to wrap the returned value from the render method in a div and create a reference to it. We do this so that we have something still within the natural flow of the page to reference our position from.

```jsx
constructor(props) {
	...
	this.ref = React.createRef();
	...
}
```

And then wrap the render method to use the new Ref.

```jsx
render() {
	return <div ref={this.ref}>
		{ReactDOM.createPortal(this.props.children, this.el)}
	</div>;
}
```

Now for the fun part! We have a reference to a wrapper container that we can use as the basis for the location of the portal element. Let's do that now.

```jsx
componentDidMount() {
	...

	const {
		top: containerTop,
		left: containerLeft,
		width: containerWidth,
		height: containerHeight
	} = (this.ref.current.getBoundingClientRect && this.ref.current.getBoundingClientRect()) || {};

	const containerXCenter = containerLeft + (containerWidth / 2);

	const {width, height} = (this.el.getBoundingClientRect && this.el.getBoundingClientRect()) || {};

	let top = containerTop + containerHeight;
	let left = containerXCenter - (width / 2);

	this.el.style.top = `${top}px`;
	this.el.style.left = `${left}px`;
}
```

Note that we're getting the center point so we can place the element in a more logical way.

With this done we get the following:

![Info Pane Almost There](/images/react-widget-portal-2.png)

Yay, it's now positioning correctly! The downside is it's running off the side of the page again, so let's fix that up now. To do this all we need to do is get the edges of the page and force the element to stay within it.

## Widget Portal Complete

First I like to add a little buffer so it's not flat up against the edge of the page, so add this to the constructor:

```jsx
this.BUFFER = 4;
```

Next let's modify the componentDidMount function to take into account the page width and height. First grab the data we need based on the dimensions of the HTML:

```jsx
const documentHeight = document.documentElement.clientHeight;
const documentWidth = document.documentElement.clientWidth;
```

Next, after getting the container and portal dimensions we set all the absolute position values of the element:

```jsx
let top = containerTop + containerHeight;
let bottom = documentHeight - (top + height);
let left = containerXCenter - (width / 2);
let right = documentWidth - (left + width);
```

Lastly we need to make sure none of these elements fall outside the screen (and buffer), and if they do force them in.

```jsx
if (right < this.BUFFER) {
	this.el.style.right = `${this.BUFFER}px`;
} else {
	this.el.style.left = `${left < this.BUFFER ? this.BUFFER : left}px`;
}
if (bottom < this.BUFFER) {
	this.el.style.bottom = `${this.BUFFER}px`;
} else {
	this.el.style.top = `${top < this.BUFFER ? this.BUFFER : top}px`;
}
```

As you can see all we're doing is setting either the right/left and bottom/top absolute positions to make sure they sit within the bounds of the screen. You can see the result of this as so:

![Info Pane Success](/images/react-widget-portal-3.png)

Success! The tooltips now all sit within the bounds of the page, and always will based on the size of whatever portal you throw at it. Well, as long as the portal itself isn't larger than the page, but that would just be silly, right?

Just to make it clear how it all works I'll post the whole `componentDidMount` here with comments so you can see how all the parts work together.

```jsx
componentDidMount() {
	// Get the document height and width which this portal is added to
	const documentHeight = document.documentElement.clientHeight;
	const documentWidth = document.documentElement.clientWidth;

	// Place the modal Element into the root DOM node
	this.documentRoot.appendChild(this.el);

	// Get the size of the portal container
	const {
		top: containerTop,
		left: containerLeft,
		width: containerWidth,
		height: containerHeight
	} = (this.ref.current.getBoundingClientRect && this.ref.current.getBoundingClientRect()) || {};

	// Get the container's center point on the X-axis for positioning the element correctly
	const containerXCenter = containerLeft + (containerWidth / 2);

	// Get the size of this portal element
	const {width, height} = (this.el.getBoundingClientRect && this.el.getBoundingClientRect()) || {};

	// Position the sides of the element from the respective sides of the screen
	let top = containerTop + containerHeight;
	let bottom = documentHeight - (top + height);
	let left = containerXCenter - (width / 2);
	let right = documentWidth - (left + width);

	// Position the element correctly based on the center of the base of the parent element
	// Ensure the Element doesn't fall off the right of the screen
	if (right < this.BUFFER) {
		this.el.style.right = `${this.BUFFER}px`;
	} else { // Or the left
		this.el.style.left = `${left < this.BUFFER ? this.BUFFER : left}px`;
	}
	// Ensure the Element doesn't fall off the bottom of the screen
	if (bottom < this.BUFFER) {
		this.el.style.bottom = `${this.BUFFER}px`;
	} else { // Or the top
		this.el.style.top = `${top < this.BUFFER ? this.BUFFER : top}px`;
	}
}
```

Before we forget we have to make sure we clean up our references so make sure you do that in the standard React way like so:

```jsx
componentWillUnmount() {
	if (!this.el) return;
	this.documentRoot.removeChild(this.el);
}
```

## Conclusion

Now we have a complete and functional widget wrapper that uses React's `createPortal` to wrap any and all dropdown/modal/popup elements we may need. There are, of course, ways to improve upon this such as: passing in a reference instead of creating one within the portal for a more accurate location; handling correcting the elements position when zoomed in; and more, but I'll leave those as an exercise to the reader. (For a hint on the zoom, look at `window.scrollX` and `window.scrollY`)

Thanks for reading, and if you have any questions/corrections please feel free to let me know!