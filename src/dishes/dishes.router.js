const router = require("express").Router();
const controller = require("./dishes.controller");
const methodNotAllowed = require("../errors/methodNotAllowed");

//---------Routes
router
	.route("/")
	.get(controller.list)
	.post(controller.create)
	.all(methodNotAllowed);

router
	.route("/:dishId")
	.get(controller.read)
	.put(controller.update)
	.all(methodNotAllowed);

//-----exports

module.exports = router;
