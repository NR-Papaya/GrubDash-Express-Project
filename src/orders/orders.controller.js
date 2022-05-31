const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//------------Middleware Funcs
const validateId = (req, res, next) => {
	const { orderId } = req.params;
	const foundOrder = orders.find((order) => order.id === orderId);
	if (foundOrder) {
		res.locals.order = foundOrder;
		next();
	} else {
		next({
			status: 404,
			message: `An order with an ID of ${orderId} could not be found.`,
		});
	}
};
const validateProperties = (property) => {
	return function (req, res, next) {
		const { data = {} } = req.body;
		if (data[property]) {
			return next();
		} else {
			next({
				status: 400,
				message: `Order must include a ${property}`,
			});
		}
	};
};
const validateHasDishes = (req, res, next) => {
	const { data: { dishes } = {} } = req.body;
	if (Array.isArray(dishes) === false || dishes.length <= 0) {
		next({ status: 400, message: `Order must include at least one dish` });
	} else {
		next();
	}
};
const validateQuantityOfDish = (req, res, next) => {
	const { data: { dishes } = {} } = req.body;
	for (let i = 0; i < dishes.length; i++) {
		if (
			!dishes[i].quantity ||
			dishes[i].quantity <= 0 ||
			!Number.isInteger(dishes[i].quantity)
		) {
			return next({
				status: 400,
				message: `Dish ${i} must have a quantity that is an integer greater than 0`,
			});
		}
	}
	next();
};

//------------CRUD Funcs
const create = (req, res, next) => {
	const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
	const newOrder = {
		id: nextId(),
		deliverTo,
		mobileNumber,
		status: "delivered",
		dishes,
	};
	orders.push(newOrder);
	res.status(201).json({ data: newOrder });
};

const list = (req, res, next) => {
	res.json({ data: orders });
};
const read = (req, res, next) => {
	res.json({ data: res.locals.order });
};

const update = (req, res, next) => {};

const destroy = (req, res, next) => {};

module.exports = {
	create: [
		validateProperties("deliverTo"),
		validateProperties("mobileNumber"),
		validateProperties("dishes"),
		validateHasDishes,
		validateQuantityOfDish,
		create,
	],
	list,
	read: [validateId, read],
	update,
	destroy,
};
