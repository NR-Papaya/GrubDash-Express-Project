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

const validateBodyId = (req, res, next) => {
	const { data: { id } = {} } = req.body;
	const { orderId } = req.params;
	if (!id) {
		next();
	}
	if (id !== orderId) {
		next({
			status: 400,
			message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
		});
	} else {
		next();
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

const checkStatusDelivered = (req, res, next) => {
	const orderToCheck = res.locals.order;

	if (orderToCheck.status === "delivered") {
		return next({
			status: 400,
			message: `A delivered order cannot be changed`,
		});
	} else {
		next();
	}
};

const checkStatusPending = (req, res, next) => {
	const orderToCheck = res.locals.order;
	if (orderToCheck.status === "pending") {
		next();
	} else {
		next({
			status: 400,
			message: `An order cannot be deleted unless it is pending`,
		});
	}
};

const checkValidOrderStatus = (req, res, next) => {
	const { data: { status } = {} } = req.body;
	const validOrderStatus = [
		"pending",
		"preparing",
		"out-for-delivery",
		"delivered",
	];
	if (!validOrderStatus.includes(status)) {
		return next({
			status: 400,
			message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
		});
	} else {
		next();
	}
};

//------------CRUD Funcs
const create = (req, res, next) => {
	const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
	const newOrder = {
		id: nextId(),
		deliverTo,
		mobileNumber,
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

const update = (req, res, next) => {
	const orderToUpdate = res.locals.order;
	const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;
	//update order
	orderToUpdate.deliverTo = deliverTo;
	orderToUpdate.mobileNumber = mobileNumber;
	orderToUpdate.dishes = dishes;
	orderToUpdate.status = status;

	res.json({ data: orderToUpdate });
};

const destroy = (req, res, next) => {
	const { orderId } = req.params;
	const indexToDelete = orders.findIndex((order) => orderId === order.id);
	orders.splice(indexToDelete, 1);
	res.status(204).json({ data: orders });
};

//--------exports

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
	update: [
		validateId,
		validateBodyId,
		checkStatusDelivered,
		checkValidOrderStatus,
		validateProperties("deliverTo"),
		validateProperties("mobileNumber"),
		validateProperties("dishes"),
		validateProperties("status"),
		validateHasDishes,
		validateQuantityOfDish,
		update,
	],
	delete: [validateId, checkStatusPending, destroy],
};
