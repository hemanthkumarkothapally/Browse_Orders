sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/f/library",
    'sap/ui/core/Fragment',
    "sap/m/MessageBox"
], (Controller, Filter, fioriLibrary, Fragment, MessageBox) => {
    "use strict";

    return Controller.extend("com.db.oders.orderdetails.controller.OrderDetails", {
        onInit() {
            this.byId("productstable").attachEvent("updateFinished", this._onCalculateTotalsum, this);
            this.byId("orderList").attachEvent("updateFinished", this._onListUpdateFinished, this);

            let oModel = this.getOwnerComponent().getModel("orderdetailsmodel");
            oModel.setData({
                totalorders:0,
                totalproductssum: 0,
                selectedorder: {},
                selectedEmployee: {},
                selectedcustomer: {}
            })

        },
        onFilter: function () {

            if (!this._mfilterDialogs) {
                this._mfilterDialogs = sap.ui.xmlfragment("com.db.oders.orderdetails.view.filter", this);
                this.getView().addDependent(this._mfilterDialogs);

            }
            this._mfilterDialogs.open();
        },
        onGroup: function () {
            if (!this._mgroupDialogs) {
                this._mgroupDialogs = sap.ui.xmlfragment("com.db.oders.orderdetails.view.group", this);
                this.getView().addDependent(this._mgroupDialogs);

            }
            this._mgroupDialogs.open()
        },
        handleConfirm: function (oEvent) {
            const sDialogType = oEvent.getSource().getMetadata().getName(); // Determine whether it's filter or group
            const oList = this.byId("orderList");
            const oBinding = oList.getBinding("items");

            if (sDialogType === "sap.m.ViewSettingsDialog") {
                const mParams = oEvent.getParameters();
                // === GROUPING ===
                if (mParams.groupItem) {
                    const sKey = mParams.groupItem.getKey();
                    let ogroupSorter;

                    switch (sKey) {
                        case "1": // Group by Customer
                            ogroupSorter = new sap.ui.model.Sorter("Customer/ContactName", false, true);
                            oBinding.sort(ogroupSorter);
                            break;
                        case "2": // Group by Order Period
                            ogroupSorter = new sap.ui.model.Sorter("OrderDate", false, true);
                            oBinding.sort(ogroupSorter);
                            break;
                        case "3": // Group by Shipped Period
                            ogroupSorter = new sap.ui.model.Sorter("ShippedDate", false, true);
                            oBinding.sort(ogroupSorter);
                            break;

                    }
                    
                }
                else {
                    oBinding.sort();
                }
                if(mParams.groupDescending){
                    console.log("yes")
                    const bDescending = mParams.groupDescending;
                    let oOrdersorter = new sap.ui.model.Sorter("OrderID",bDescending);
                    oBinding.sort(oOrdersorter);

                }
                // === FILTERING ===
                if (mParams.filterItems) {
                    const aFilters = [];

                    mParams.filterItems.forEach(function (oItem) {
                        const sKey = oItem.getKey();
                        switch (sKey) {
                            case "1a": // Only Shipped Orders
                                aFilters.push(new Filter("ShippedDate", sap.ui.model.FilterOperator.NE, null));
                                break;
                            case "1b": // Orders without Shipment
                                aFilters.push(new Filter("ShippedDate", sap.ui.model.FilterOperator.EQ, null));
                                break;
                        }
                    });

                    oBinding.filter(aFilters);
                }
            }
            // this.getOwnerComponent().getModel("orderdetailsmodel").setProperty("/totalorders", undefined);

            // this.getOwnerComponent().getModel("orderdetailsmodel").setData({
            //     totalorders: this.byId("orderList").mAggregations.items.length
            // });
            // this.getOwnerComponent().getModel("orderdetailsmodel").setProperty("/totalorders",this.byId("orderList").mAggregations.items.length);
            // this.byId("maintittle").setText(this.byId("orderList").mAggregations.items.length)

        },
        formatDate: function (sDate) {
            if (!sDate) return "";
            const oDate = new Date(sDate);
            return oDate.toLocaleDateString(); // Or use DateFormat for more control
        },
        onSearch: function (oEvent) {
            let sQuery = oEvent.getParameter("query");
            let aFilter = [];
            if (sQuery) {
                aFilter.push(new Filter({
                    path: "Customer/ContactName",
                    operator: "Contains",
                    value1: sQuery
                })
                )
            }
            this.getView().byId("orderList").getBinding("items").filter(aFilter);

            console.log(aFilter);
        },
        onlistitempress: function (oEvent) {
            const oSelectedData = oEvent.getSource().getBindingContext().getObject();
            const sBaseUrl = sap.ui.require.toUrl("com/db/oders/orderdetails");
            const oModel = this.getOwnerComponent().getModel("orderdetailsmodel");
            const oFCL = this.byId("flexibleColumnLayout");
            this.byId("icontabbar").setSelectedKey("shipping");
            sap.ui.core.BusyIndicator.show(0);
            // let oModel1=this.getView().getModel();

            // const sOrderPath = "/Orders(" + oSelectedData.OrderID + ")";

            // oModel1.read(sOrderPath, {
            //     success: function (orderData) {
            //         oModel.setProperty("/selectedorder", orderData);

            //         let customerID = orderData.CustomerID;
            //         customerID = customerID.replace(/^["'](.*)["']$/, '$1'); // Strip quotes

            //         const sCustomerPath = "/Customers('" + customerID + "')";
            //         oModel1.read(sCustomerPath, {
            //             success: function (customerData) {
            //                 oModel.setProperty("/selectedcustomer", customerData);
            //             },
            //             error: function (err) {
            //                 console.error("Customer fetch error:", err);
            //             }
            //         });

            //         if (oSelectedData.ProductID) {
            //             const sProductPath = "/Products(" + oSelectedData.ProductID + ")";
            //             oModel1.read(sProductPath, {
            //                 success: function (productData) {
            //                     oModel.setProperty("/selectedproduct", productData);
            //                 },
            //                 error: function (err) {
            //                     console.error("Product fetch error:", err);
            //                 }
            //             });
            //         }

            //     },
            //     error: function (err) {
            //         console.error("Order fetch error:", err);
            //     }
            // });
            // Get Order Details
            let tableFilter = [new Filter({
                path: "OrderID",
                operator: "EQ",
                value1: oSelectedData.OrderID
            })];
            this.getView().byId("productstable").getBinding("items").filter(tableFilter);
            $.ajax({
                url: sBaseUrl + "/v2/northwind/northwind.svc/Orders(" + oSelectedData.OrderID + ")",
                method: "GET",
                dataType: "json",
                success: function (orderData) {
                    const oOrder = orderData.d;
                    oModel.setProperty("/selectedorder", oOrder);

                    // let aselectedorder = this.getOwnerComponent().getModel("orderdetailsmodel").getProperty("/selectedorder").OrderID;

                    // let tableFilter = [new Filter({
                    //     path: "OrderID",
                    //     operator: "EQ",
                    //     value1: aselectedorder
                    // })];
                    // this.getView().byId("productstable").getBinding("items").filter(tableFilter);
                    // Get Customer Details
                    $.ajax({
                        url: sBaseUrl + "/v2/northwind/northwind.svc/Customers('" + oOrder.CustomerID + "')",
                        method: "GET",
                        dataType: "json",
                        success: function (customerData) {

                            oModel.setProperty("/selectedcustomer", customerData.d);

                        },
                        error: function (xhr, status, error) {
                            console.error("Customer fetch error:", error);
                        }
                    });
                    $.ajax({
                        url: sBaseUrl + "/v2/northwind/northwind.svc/Employees(" + oOrder.EmployeeID + ")",
                        method: "GET",
                        dataType: "json",
                        success: function (customerData) {

                            oModel.setProperty("/selectedEmployee", customerData.d);

                        },
                        error: function (xhr, status, error) {
                            console.error("Customer fetch error:", error);
                        }
                    });

                    // Get Product Details from Order_Details (assuming OrderID + ProductID is available)

                }.bind(this),
                error: function (xhr, status, error) {
                    console.error("Order fetch error:", error);
                }
            });

            // Navigate to second column
            oFCL.setLayout("TwoColumnsMidExpanded");
            setTimeout(() => {
                sap.ui.core.BusyIndicator.hide();
            }, 1500);

        },
        onclosedetailspage: function () {
            this.byId("expandbutton").setIcon("sap-icon://full-screen");

            const oFCL = this.byId("flexibleColumnLayout");
            oFCL.setLayout("OneColumn");
        },
        onexpanddetailspage: function () {
            let aicon = this.byId("expandbutton").getIcon();
            if (aicon === "sap-icon://exit-full-screen") {
                this.byId("expandbutton").setIcon("sap-icon://full-screen");
                let oFCL = this.byId("flexibleColumnLayout");
                oFCL.setLayout("TwoColumnsMidExpanded");
            }
            else {
                this.byId("expandbutton").setIcon("sap-icon://exit-full-screen");
                let oFCL = this.byId("flexibleColumnLayout");
                oFCL.setLayout("MidColumnFullScreen");
            }
        },
        formatPhoto: function (photoData) {
            if (!photoData) {
                return "sap-icon://person-placeholder"; // fallback image
            }
            return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAPFBMVEXk5ueutLepsLPo6uursbXJzc/p6+zj5ea2u76orrKvtbi0ubzZ3N3O0dPAxcfg4uPMz9HU19i8wcPDx8qKXtGiAAAFTElEQVR4nO2d3XqzIAyAhUD916L3f6+f1m7tVvtNINFg8x5tZ32fQAIoMcsEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQRAEQTghAJD1jWtnXJPP/54IgNzZQulSmxvTH6oYXX4WS+ivhTbqBa1r26cvCdCu6i0YXbdZ0o4A1rzV+5IcE3YE+z58T45lqo7g1Aa/JY5tgoqQF3qb382x7lNzBLcxft+O17QUYfQI4IIeklKsPSN4i6LKj/7Zm8n99RbHJpEw9gEBXNBpKIYLJqKYRwjOikf//r+J8ZsVuacbqCMNleI9TqGLGqMzhnVdBOdd6F/RlrFijiCoVMk320CBIahUxTWI0KKEcJqKbMdpdJb5QvdHq6wCI5qhKlgGMS/RBHkubWDAE+QZxB4xhCyDiDkLZxgGEVdQldzSKbTIhmZkFkSEPcVvmBn2SMuZB9od7fQDsMiDdKJjFUSCQarM5WirZ3C2TT/htYnyPcPfgrFHWz0BI74gr6J/IZiGUxAZGQLqmvQLTrtE/Go4YxhVRIpEw+sww1IIcqr5NKmUUzLF3d4/qPkYIp2T/obPuemlojFUR4t9Q2Vojhb7BmgElWHzLPH8hucfpefPNFTVgs9h1AdU/Pin96vwWbWdf+X9Absn3OdO34aMdsDnP8WgKYisTqI6CkNGqZQo1XA6Ef6AU32SJzOcBukHPF07/xNSgmHKa5BOhtezv6mA/rYJpwXNAnbRZ1XuF3BzDcO3vpA3+ny2909gbqE4hhD3LIPhLLyBNhPZvbZ3B+3tPYa18A7auSlXQayKwTPNLKDcuOB0xPYKDPFTkWsevQPRZ1J8Hji9I1KQ34r7hZhrwNwOZ97QxNx0drwn4QI0wQk1DcEsfKCWKdxVvxPSNUIp/knmAXT+nT+Ko3+0H96rcNb3m1fx7MBTJdeBJ7uFcWsc0wvgAsC4pROW0l2inbAmIBv/7GZmuhQH6API2rr8T0e6yuZJ+80A9LZeG62T3tik31XwxtwZcizKuTHkMjB1WdZde4Kmic/A5ZI3rr1ae21d08PlVHYfAaxw9G9CYRbJ+8ZdbTcMRV1XM3VdF0M32vtoTdZ0+u29s0OttJ5bz64UwinjaFMVY9vkqc3KKSxN21Xl+0L4Q3Vuv1tYl0pqnX6ms4XetFz7gdZVAgUEoJntfOUe4ZwsHd9FzqQ3Vv6xe41l0XJcqcKl6TZvlv7ClAW3BsqQW4X7ypApB8dmTgK4IX5wvqIVj33HtD2qSG4BqznxdIefL27Y4sahi0MdIdvUsDva8agGGbCtITmCY31MHD2O0uIdh/0rJDQ1VX5Zdxz3rR2QDbv6qXl9vudzqQtGm1Jv9LDXOsfvvB7VcZ8PDKD0mQ1VHPYQ9O+Yj4hR1IUD8rBnn3ho2m8oQMxbCFiKlL2ioSW5heeJqegED52CzxCtcGD3Kv8Wms9EYLyUhwaFIhSMBClevWEmiK/Iaogu4H7sg6ppQhQG8RUqivuTGOAJOg6FfgW0q0M0PQMRMEgXaeNf3SYDZ8PIMI0+wHgr/MgN7wYwpiLjCCqM6ydUDZLQiB6nDdNC8SDyig3jPPpFXGcC9O8BUBDVmgBY59E7Md/35Loe/UVEECEJwYggJjELZ4J71SaQSBeC02n4Da29CayJNA28SAhd2CQyC1Xw6pSmGSINQVuMhAZp4DClan9MgmkDDNmezqwS8sgtlXK/EPBhoaSmYVC/F7IO1jQEdHOlabpKh3+jzLQSTUiq4X2I+Ip/zU8rlaqAvkS21ElR+gqu3zbjjL+hIAiCIAiCIAiCIAiCsCf/AKrfVhSbvA+DAAAAAElFTkSuQmCC";
        },
        formatdate: function (odate) {
            let dateString = odate;
            if (!dateString) {
                return
            }
            else {
                let timestamp = parseInt(dateString.match(/\d+/)[0]); // Extract the milliseconds
                let date = new Date(timestamp);

                // Format the date as needed (e.g., YYYY-MM-DD)
                //let formattedDate = date.toISOString().split('T')[0];
                let options = { year: 'numeric', month: 'short', day: 'numeric' };
                let formattedDate = date.toLocaleDateString('en-US', options);

                return formattedDate;
            }
        },
        deliveryState: function (requiredDate, shippedDate) {
            if (!requiredDate || !shippedDate) {
                return "None";
            }

            const reqDate = new Date(requiredDate);
            const shipDate = new Date(shippedDate);

            return shipDate <= reqDate ? "Success" : "Error";
        },

        deliveryText: function (requiredDate, shippedDate) {
            if (!requiredDate || !shippedDate) {
                return "Date Missing";
            }

            const reqDate = new Date(requiredDate);
            const shipDate = new Date(shippedDate);

            return shipDate <= reqDate ? "On Time" : "Late Delivery";
        },
        decimalPrice: function (value) {
            if (!value && value !== 0) return "0.00";
            return parseFloat(value).toFixed(2);
        },
        totalcaliucate: function (price, num, per) {
            let discount = (price * num) * per;
            let value = (price * num) - discount;
            if (!value && value !== 0) return "0.00";
            return value.toFixed(2);

        },
        _onCalculateTotalsum: function (text) {
            let oTable = this.byId("productstable");
            let aItems = oTable.getItems(); // only returns visible (filtered) rows
            let fTotalSum = 0;
            console.log(aItems.length)
            aItems.forEach((oItem) => {
                let oContext = oItem.getBindingContext();
                if (oContext) {
                    let oData = oContext.getObject();
                    let unitPrice = oData.UnitPrice;
                    let quantity = oData.Quantity;
                    let discount = oData.Discount;

                    let total = unitPrice * quantity * (1 - discount);
                    fTotalSum += parseFloat(total.toFixed(2));
                }
            });
            console.log("Visible Total Sum:", fTotalSum);
            console.log(this.getOwnerComponent().getModel("orderdetailsmodel"));
            this.getOwnerComponent().getModel("orderdetailsmodel").setProperty("/totalproductssum",aItems.length);
            this.getView().byId("someTextId").setNumber(fTotalSum.toFixed(2));
            // this.getOwnerComponent().getModel("orderdetailsmodel").setData({
                // totalorders: this.byId("orderList").mAggregations.items.length
            // });
            // this.getOwnerComponent().getModel("orderdetailsmodel").setProperty("/totalorders",this.byId("orderList").mAggregations.items.length);
            // this.byId("maintittle").setText(this.byId("orderList").mAggregations.items.length)
        },
        _onListUpdateFinished:function(){
            this.getOwnerComponent().getModel("orderdetailsmodel").setProperty("/totalorders",this.byId("orderList").mAggregations.items.length);

        }

    });
});