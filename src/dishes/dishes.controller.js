const { verify } = require("crypto");
const path = require("path");
const dishesData = require("../data/dishes-data");

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

//------------Middleware Funcs
const validateIdExists = (req, res, next) => {
	const { dishId } = req.params;
	const matchingDish = dishesData.find((dish) => dish.id === dishId);
	if (matchingDish) {
		res.locals.dish = matchingDish;
		return next();
	} else {
		return next({
			status: 404,
			message: `A dish with an ID of: ${dishId} could not be found`,
		});
	}
};

const validateBodyId = (req, res, next) => {
	const { data: { id } = {} } = req.body;
	const { dishId } = req.params;
	if (!id) {
		next();
	}
	if (id !== dishId) {
		next({
			status: 400,
			message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
		});
	} else {
		next();
	}
};

const verifyHasProperty = (propertyName) => {
	return function (req, res, next) {
		const { data = {} } = req.body;
		if (data[propertyName]) {
			return next();
		} else {
			next({
				status: 400,
				message: `Dish must include a ${propertyName}`,
			});
		}
	};
};

const validatePrice = (req, res, next) => {
	const { data: { price } = {} } = req.body;
	if (price <= 0 || Number.isInteger(price) === false) {
		return next({
			status: 400,
			message: `Dish must have a price that is an integer greater than 0`,
		});
	} else {
		next();
	}
};

//------------CRUD Funcs

const create = (req, res, next) => {
	const {
		data: { name, description, price, image_url },
	} = req.body;
	const newDish = {
		name,
		description,
		price,
		image_url,
		id: nextId(),
	};
	dishesData.push(newDish);
	res.status(201).json({ data: newDish });
};

const list = (req, res, next) => {
	res.json({ data: dishesData });
};

const read = (req, res, next) => {
	res.json({ data: res.locals.dish });
};

const update = (req, res, next) => {
	const currentDish = res.locals.dish;
	const {
		data: { name, description, price, image_url },
	} = req.body;
	//update current dish with new data
	currentDish.name = name;
	currentDish.description = description;
	currentDish.price = price;
	currentDish["image_url"] = image_url;
	res.json({ data: currentDish });
};

//--------export

module.exports = {
	create: [
		verifyHasProperty("name"),
		verifyHasProperty("description"),
		verifyHasProperty("price"),
		verifyHasProperty("image_url"),
		validatePrice,
		create,
	],
	list,
	read: [validateIdExists, read],
	update: [
		validateIdExists,
		verifyHasProperty("name"),
		verifyHasProperty("description"),
		verifyHasProperty("price"),
		verifyHasProperty("image_url"),
		validateBodyId,
		validatePrice,
		update,
	],
};
