const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

//------------Middleware Funcs
function validateId(req, res, next) {
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
}

function validateBodyId(req, res, next) {
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
}

function validateProperties(property) {
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
}

function validateHasDishes(req, res, next) {
	const { data: { dishes } = {} } = req.body;
	if (Array.isArray(dishes) === false || dishes.length <= 0) {
		next({ status: 400, message: `Order must include at least one dish` });
	} else {
		next();
	}
}

function validateQuantityOfDish(req, res, next) {
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
}

function checkStatusDelivered(req, res, next) {
	const orderToCheck = res.locals.order;

	if (orderToCheck.status === "delivered") {
		return next({
			status: 400,
			message: `A delivered order cannot be changed`,
		});
	} else {
		next();
	}
}

function checkStatusPending(req, res, next) {
	const orderToCheck = res.locals.order;
	if (orderToCheck.status === "pending") {
		next();
	} else {
		next({
			status: 400,
			message: `An order cannot be deleted unless it is pending`,
		});
	}
}

function checkValidOrderStatus(req, res, next) {
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
}

//------------CRUD Funcs
function create(req, res, next) {
	const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
	const newOrder = {
		id: nextId(),
		deliverTo,
		mobileNumber,
		dishes,
	};
	orders.push(newOrder);
	res.status(201).json({ data: newOrder });
}

function list(req, res, next) {
	res.json({ data: orders });
}

function read(req, res, next) {
	res.json({ data: res.locals.order });
}

function update(req, res, next) {
	const orderToUpdate = res.locals.order;
	const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;
	//update order
	orderToUpdate.deliverTo = deliverTo;
	orderToUpdate.mobileNumber = mobileNumber;
	orderToUpdate.dishes = dishes;
	orderToUpdate.status = status;

	res.json({ data: orderToUpdate });
}

function destroy(req, res, next) {
	const { orderId } = req.params;
	const indexToDelete = orders.findIndex((order) => orderId === order.id);
	orders.splice(indexToDelete, 1);
	res.status(204).json({ data: orders });
}

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
