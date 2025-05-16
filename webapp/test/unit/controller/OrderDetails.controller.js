/*global QUnit*/

sap.ui.define([
	"com/db/oders/orderdetails/controller/OrderDetails.controller"
], function (Controller) {
	"use strict";

	QUnit.module("OrderDetails Controller");

	QUnit.test("I should test the OrderDetails controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
