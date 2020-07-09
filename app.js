/**
 * Created by Sukitha on 12/16/2016.
 */
var restify = require("restify");
var logger = require("dvp-common-lite/LogHandler/CommonLogHandler.js").logger;
var config = require("config");
var jwt = require("restify-jwt");
var secret = require("dvp-common-lite/Authentication/Secret.js");
var authorization = require("dvp-common-lite/Authentication/Authorization.js");
var logger = require("dvp-common-lite/LogHandler/CommonLogHandler.js").logger;
var msg = require("dvp-common-lite/CommonMessageGenerator/ClientMessageJsonFormatter.js");

var modle = require("dvp-mongomodels");
var Question = require("dvp-mongomodels/model/QuestionPaper").Question;
var Section = require("dvp-mongomodels/model/QuestionPaper").QuestionSection;
var Paper = require("dvp-mongomodels/model/QuestionPaper").QuestionPaper;
var Submission = require("dvp-mongomodels/model/QuestionPaper")
  .QuestionPaperSubmission;
var Answer = require("dvp-mongomodels/model/QuestionPaper").QuestionAnswer;
var User = require("dvp-mongomodels/model/User");

var util = require("util");
var port = config.Host.port || 3000;
var host = config.Host.vdomain || "localhost";

var server = restify.createServer({
  name: "DVP QA module Service",
});

server.pre(restify.pre.userAgentConnection());
server.use(restify.bodyParser({ mapParams: false }));

restify.CORS.ALLOW_HEADERS.push("authorization");
server.use(restify.CORS());
server.use(restify.fullResponse());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());

server.use(jwt({ secret: secret.Secret }));

server.listen(port, function () {
  logger.info(
    "DVP-QAModule.main Server %s listening at %s",
    server.name,
    server.url
  );
});

server.post(
  "/DVP/API/:version/QAModule/Question",
  authorization({ resource: "qualityassurance", action: "write" }),
  function (req, res, next) {
    logger.debug("DVP-QAModule.CreateQuestion HTTP");
    var company;
    var tenant;

    if (req && req.user && req.user.company && req.user.tenant) {
      company = req.user.company;
      tenant = req.user.tenant;

      if (req.body) {
        var question = Question({
          question: req.body.question,
          section: req.body.section,
          weight: req.body.weight,
          type: req.body.type,
          company: company,
          tenant: tenant,
        });

        var message;
        question.save(function (err, question) {
          if (err) {
            logger.error("DVP-QAModule.CreateQuestion failed ", err);
            var message = msg.FormatMessage(
              err,
              "Question creation failed",
              false,
              undefined
            );
          } else {
            if (question) {
              logger.info("DVP-QAModule.CreateQuestion successful");
              var message = msg.FormatMessage(
                err,
                "Question creation successful",
                true,
                question
              );
            } else {
              logger.error("DVP-QAModule.CreateQuestion failed ");
              var message = msg.FormatMessage(
                undefined,
                "Question creation failed",
                false,
                undefined
              );
            }
          }
          res.write(message);
          res.end();
        });
      } else {
        logger.error("DVP-QAModule.CreateQuestion request.body is null");
        var instance = msg.FormatMessage(
          undefined,
          "create question failed",
          false,
          undefined
        );
        res.write(instance);
        res.end();
      }
    } else {
      res.write(
        msg.FormatMessage(
          err,
          "Token error, no company data found",
          false,
          undefined
        )
      );
      res.end();
    }

    return next();
  }
);

server.post(
  "/DVP/API/:version/QAModule/Section",
  authorization({ resource: "qualityassurance", action: "write" }),
  function (req, res, next) {
    logger.debug("DVP-QAModule.CreateSection HTTP");

    var company;
    var tenant;

    if (req && req.user && req.user.company && req.user.tenant) {
      company = req.user.company;
      tenant = req.user.tenant;

      if (req.body) {
        var section = Section({
          name: req.body.name,
          description: req.body.description,
          company: company,
          tenant: tenant,
        });

        var message;

        section.save(function (err, section) {
          if (err) {
            logger.error("DVP-QAModule.CreateSection failed ", err);
            var message = msg.FormatMessage(
              err,
              "Section creation failed",
              false,
              undefined
            );
          } else {
            if (section) {
              logger.info("DVP-QAModule.CreateSection successful");
              var message = msg.FormatMessage(
                err,
                "Section creation successful",
                true,
                section
              );
            } else {
              logger.error("DVP-CreateSection.CreateSection failed ");
              var message = msg.FormatMessage(
                undefined,
                "Section creation failed",
                false,
                undefined
              );
            }
          }

          res.write(message);
          res.end();
        });
      } else {
        logger.error("DVP-AutoAttendant.CreateSection request.body is null");

        var instance = msg.FormatMessage(
          undefined,
          "Section creation failed",
          false,
          undefined
        );
        res.write(instance);
        res.end();
      }
    } else {
      res.write(
        msg.FormatMessage(
          err,
          "Token error, no company data found",
          false,
          undefined
        )
      );
      res.end();
    }

    return next();
  }
);

server.get(
  "/DVP/API/:version/QAModule/Questions",
  authorization({ resource: "qualityassurance", action: "read" }),
  function (req, res, next) {
    logger.info("DVP-QAModule.GetQuestions Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Question.find(
      {
        company: company,
        tenant: tenant,
      },
      function (err, questions) {
        //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
        if (err) {
          jsonString = msg.FormatMessage(
            err,
            "Get all questions failed",
            false,
            undefined
          );
        } else {
          if (questions) {
            jsonString = msg.FormatMessage(
              undefined,
              "Get all questions Successful",
              true,
              questions
            );
          } else {
            jsonString = msg.FormatMessage(
              undefined,
              "No questions Found",
              false,
              questions
            );
          }
        }

        res.end(jsonString);
      }
    );

    next();
  }
);

server.get(
  "/DVP/API/:version/QAModule/Question/:id/ValidateSubmission",
  authorization({ resource: "qualityassurance", action: "read" }),
  function (req, res, next) {
    logger.info("DVP-QAModule.GetQuestions Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var questionId = req.params.id;
    var jsonString;
    Answer.findOne(
      {
        company: company,
        tenant: tenant,
        question: questionId,
      },
      function (err, answer) {
        //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
        if (err) {
          jsonString = msg.FormatMessage(
            err,
            "Question submission validation failed",
            false,
            false
          );
        } else {
          if (answer) {
            jsonString = msg.FormatMessage(
              null,
              "Question already used in submission history",
              true,
              false
            );
          } else {
            jsonString = msg.FormatMessage(
              null,
              "Question not used in submission history",
              true,
              true
            );
          }
        }

        res.end(jsonString);
      }
    );

    next();
  }
);

server.del(
  "/DVP/API/:version/QAModule/Question/:id",
  authorization({ resource: "qualityassurance", action: "delete" }),
  function (req, res, next) {
    logger.info("DVP-QAModule.DeleteQuestion Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Question.findOneAndRemove(
      {
        _id: req.params.id,
        company: company,
        tenant: tenant,
      },
      function (err, questions) {
        //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
        if (err) {
          jsonString = msg.FormatMessage(
            err,
            "Delete question failed",
            false,
            undefined
          );
        } else {
          if (questions) {
            jsonString = msg.FormatMessage(
              undefined,
              "Delete question Successful",
              true,
              questions
            );
          } else {
            jsonString = msg.FormatMessage(
              undefined,
              "No question Found",
              false,
              questions
            );
          }
        }

        res.end(jsonString);
      }
    );

    next();
  }
);

server.get(
  "/DVP/API/:version/QAModule/Question/:id",
  authorization({ resource: "qualityassurance", action: "read" }),
  function (req, res, next) {
    logger.info("DVP-QAModule.GetQuestion Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Question.findOne(
      {
        _id: req.params.id,
        company: company,
        tenant: tenant,
      },
      function (err, questions) {
        //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
        if (err) {
          jsonString = msg.FormatMessage(
            err,
            "Get question failed",
            false,
            undefined
          );
        } else {
          if (questions) {
            jsonString = msg.FormatMessage(
              undefined,
              "Get question Successful",
              true,
              questions
            );
          } else {
            jsonString = msg.FormatMessage(
              undefined,
              "No question Found",
              false,
              questions
            );
          }
        }

        res.end(jsonString);
      }
    );

    next();
  }
);

server.get(
  "/DVP/API/:version/QAModule/Sections",
  authorization({ resource: "qualityassurance", action: "read" }),
  function (req, res, next) {
    logger.info("DVP-QAModule.GetSections Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Section.find(
      {
        company: company,
        tenant: tenant,
      },
      function (err, sections) {
        //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
        if (err) {
          jsonString = msg.FormatMessage(
            err,
            "Get all sections failed",
            false,
            undefined
          );
        } else {
          if (sections) {
            jsonString = msg.FormatMessage(
              undefined,
              "Get all sectios Successful",
              true,
              sections
            );
          } else {
            jsonString = msg.FormatMessage(
              undefined,
              "No section Found",
              true,
              sections
            );
          }
        }

        res.end(jsonString);
      }
    );

    next();
  }
);

server.get(
  "/DVP/API/:version/QAModule/Section/:id",
  authorization({ resource: "qualityassurance", action: "read" }),
  function (req, res, next) {
    logger.info("DVP-QAModule.GetSection Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Section.findOne(
      {
        _id: req.params.id,
        company: company,
        tenant: tenant,
      },
      function (err, section) {
        //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
        if (err) {
          jsonString = msg.FormatMessage(
            err,
            "Get section failed",
            false,
            undefined
          );
        } else {
          if (section) {
            jsonString = msg.FormatMessage(
              undefined,
              "Get section Successful",
              true,
              section
            );
          } else {
            jsonString = msg.FormatMessage(
              undefined,
              "No section Found",
              false,
              undefined
            );
          }
        }

        res.end(jsonString);
      }
    );

    next();
  }
);

server.post(
  "/DVP/API/:version/QAModule/Paper",
  authorization({ resource: "qualityassurance", action: "write" }),
  function (req, res, next) {
    logger.debug("DVP-QAModule.CreateQuestionPaper HTTP");
    var company;
    var tenant;

    if (req && req.user && req.user.company && req.user.tenant) {
      company = req.user.company;
      tenant = req.user.tenant;

      if (req.body) {
        var paper = Paper({
          name: req.body.name,
          active: true,
          company: company,
          tenant: tenant,
        });

        var message;
        paper.save(function (err, qp) {
          if (err) {
            logger.error("DVP-QAModule.CreateQuestionPaper failed ", err);
            var message = msg.FormatMessage(
              err,
              "Question Paper creation failed",
              false,
              undefined
            );
          } else {
            if (qp) {
              logger.info("DVP-QAModule.CreateQuestionPaper successful");
              var message = msg.FormatMessage(
                err,
                "Question paper creation successful",
                true,
                qp
              );
            } else {
              logger.error("DVP-QAModule.CreateQuestion failed ");
              var message = msg.FormatMessage(
                undefined,
                "Question creation failed",
                false,
                undefined
              );
            }
          }
          res.write(message);
          res.end();
        });
      } else {
        logger.error("DVP-QAModule.CreateQuestionPaper request.body is null");
        var instance = msg.FormatMessage(
          undefined,
          "create question paper failed",
          false,
          undefined
        );
        res.write(instance);
        res.end();
      }
    } else {
      res.write(
        msg.FormatMessage(
          err,
          "Token error, no company data found",
          false,
          undefined
        )
      );
      res.end();
    }

    return next();
  }
);

server.get(
  "/DVP/API/:version/QAModule/QuestionPapers",
  authorization({ resource: "qualityassurance", action: "read" }),
  function (req, res, next) {
    logger.info("DVP-QAModule.GetQuestionPapers Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Paper.find({
      company: company,
      tenant: tenant,
      active: true,
    })
      .populate("questions")
      .exec(function (err, qp) {
        //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
        if (err) {
          jsonString = msg.FormatMessage(
            err,
            "Get all question papers failed",
            false,
            undefined
          );
        } else {
          if (qp) {
            jsonString = msg.FormatMessage(
              undefined,
              "Get all question papers Successful",
              true,
              qp
            );
          } else {
            jsonString = msg.FormatMessage(
              undefined,
              "No question papers Found",
              false,
              qp
            );
          }
        }

        res.end(jsonString);
      });

    next();
  }
);

server.get(
  "/DVP/API/:version/QAModule/QuestionPapersAll",
  authorization({ resource: "qualityassurance", action: "read" }),
  function (req, res, next) {
    logger.info("DVP-QAModule.GetQuestionPapersAll Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Paper.find({
      company: company,
      tenant: tenant,
    })
      .populate("questions")
      .exec(function (err, qp) {
        //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
        if (err) {
          jsonString = msg.FormatMessage(
            err,
            "Get all question papers failed",
            false,
            undefined
          );
        } else {
          if (qp) {
            jsonString = msg.FormatMessage(
              undefined,
              "Get all question papers Successful",
              true,
              qp
            );
          } else {
            jsonString = msg.FormatMessage(
              undefined,
              "No question papers Found",
              false,
              qp
            );
          }
        }

        res.end(jsonString);
      });

    next();
  }
);

server.get(
  "/DVP/API/:version/QAModule/QuestionPaper/:id",
  authorization({ resource: "qualityassurance", action: "read" }),
  function (req, res, next) {
    logger.info("DVP-QAModule.GetQuestionPaper Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Paper.findOne({
      _id: req.params.id,
      company: company,
      tenant: tenant,
    })
      .populate("questions")
      .exec(function (err, qp) {
        //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
        if (err) {
          jsonString = msg.FormatMessage(
            err,
            "Get question paper failed",
            false,
            undefined
          );
        } else {
          if (qp) {
            jsonString = msg.FormatMessage(
              undefined,
              "Get question paper Successful",
              true,
              qp
            );
          } else {
            jsonString = msg.FormatMessage(
              undefined,
              "No question paper Found",
              false,
              undefined
            );
          }
        }

        res.end(jsonString);
      });

    next();
  }
);

server.put(
  "/DVP/API/:version/QAModule/QuestionPaper/:id/Question",
  authorization({ resource: "qualityassurance", action: "write" }),
  function (req, res, next) {
    logger.debug("DVP-QAModule.AddQuestionToPaper HTTP");
    var company;
    var tenant;
    var jsonString;

    if (req && req.user && req.user.company && req.user.tenant) {
      company = req.user.company;
      tenant = req.user.tenant;

      if (req.body) {
        Paper.findOne(
          {
            _id: req.params.id,
            company: company,
            tenant: tenant,
          },
          function (err, qp) {
            //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
            if (err) {
              jsonString = msg.FormatMessage(
                err,
                "Get question paper failed",
                false,
                undefined
              );
              res.end(jsonString);
            } else {
              if (qp) {
                jsonString = msg.FormatMessage(
                  undefined,
                  "Get question paper Successful",
                  true,
                  qp
                );

                var question = Question({
                  question: req.body.question,
                  section: req.body.section,
                  weight: req.body.weight,
                  type: req.body.type,
                  company: company,
                  tenant: tenant,
                });

                var message;
                question.save(function (err, question) {
                  if (err) {
                    logger.error("DVP-QAModule.CreateQuestion failed ", err);
                    jsonString = msg.FormatMessage(
                      err,
                      "Question creation failed",
                      false,
                      undefined
                    );
                    res.end(jsonString);
                  } else {
                    if (question) {
                      logger.info("DVP-QAModule.CreateQuestion successful");
                      jsonString = msg.FormatMessage(
                        err,
                        "Question creation successful",
                        true,
                        question
                      );

                      qp.update(
                        {
                          $set: {
                            updated_at: Date.now(),
                          },
                          $addToSet: { questions: question.id },
                        },
                        function (err, obj) {
                          if (err) {
                            jsonString = msg.FormatMessage(
                              err,
                              "Fail to Find Paper",
                              false,
                              undefined
                            );
                            res.end(jsonString);
                          } else {
                            jsonString = msg.FormatMessage(
                              undefined,
                              "Add question to paper Successfully.",
                              true,
                              obj
                            );
                            res.end(jsonString);
                          }
                          res.end(jsonString);
                        }
                      );
                    } else {
                      logger.error("DVP-QAModule.CreateQuestion failed ");
                      jsonString = msg.FormatMessage(
                        undefined,
                        "Question creation failed",
                        false,
                        undefined
                      );
                      res.end(jsonString);
                    }
                  }
                });
              } else {
                jsonString = msg.FormatMessage(
                  undefined,
                  "No question paper Found",
                  false,
                  undefined
                );
                res.end(jsonString);
              }
            }
          }
        );
      } else {
        logger.error("DVP-QAModule.AddQuestionToPaper request.body is null");
        jsonString = msg.FormatMessage(
          undefined,
          "add question to paper failed",
          false,
          undefined
        );
        res.end(jsonString);
      }
    } else {
      jsonString = msg.FormatMessage(
        err,
        "Token error, no company data found",
        false,
        undefined
      );
      res.end(jsonString);
    }

    return next();
  }
);

server.put(
  "/DVP/API/:version/QAModule/QuestionPaper/:id/Activate/:active",
  authorization({ resource: "qualityassurance", action: "write" }),
  function (req, res, next) {
    logger.debug("DVP-QAModule.AddQuestionToPaper HTTP");
    var company;
    var tenant;
    var jsonString;

    if (req && req.user && req.user.company && req.user.tenant) {
      company = req.user.company;
      tenant = req.user.tenant;

      var active = req.params.active == "true";

      Paper.findOne(
        {
          _id: req.params.id,
          company: company,
          tenant: tenant,
        },
        function (err, qp) {
          if (err) {
            jsonString = msg.FormatMessage(
              err,
              "Get question paper failed",
              false,
              undefined
            );
            res.end(jsonString);
          } else {
            if (qp) {
              qp.update(
                {
                  $set: {
                    active: active,
                  },
                },
                function (err, obj) {
                  if (err) {
                    jsonString = msg.FormatMessage(
                      err,
                      "Fail to Find Paper",
                      false,
                      undefined
                    );
                    res.end(jsonString);
                  } else {
                    jsonString = msg.FormatMessage(
                      undefined,
                      "Question paper status changed successfully",
                      true,
                      obj
                    );
                    res.end(jsonString);
                  }
                  res.end(jsonString);
                }
              );
            } else {
              jsonString = msg.FormatMessage(
                undefined,
                "No question paper Found",
                false,
                undefined
              );
              res.end(jsonString);
            }
          }
        }
      );
    } else {
      jsonString = msg.FormatMessage(
        err,
        "Token error, no company data found",
        false,
        undefined
      );
      res.end(jsonString);
    }

    return next();
  }
);

server.del(
  "/DVP/API/:version/QAModule/QuestionPaper/:id/Question/:qid",
  authorization({ resource: "qualityassurance", action: "delete" }),
  function (req, res, next) {
    logger.debug("DVP-QAModule.DeleteQuestionFromPaper HTTP");
    var company;
    var tenant;
    var jsonString;

    if (req && req.user && req.user.company && req.user.tenant) {
      company = req.user.company;
      tenant = req.user.tenant;

      logger.info("DVP-QAModule.DeleteQuestionFromPaper successful");
      //jsonString = msg.FormatMessage(err, "Question creation successful", true, question);

      Paper.update(
        {
          _id: req.params.id,
          company: company,
          tenant: tenant,
        },
        {
          $set: {
            updated_at: Date.now(),
          },
          $pullAll: { questions: [req.params.qid] },
        },
        function (err, obj) {
          if (err) {
            jsonString = msg.FormatMessage(
              err,
              "Fail to Find Paper",
              false,
              undefined
            );
            res.end(jsonString);
          } else {
            jsonString = msg.FormatMessage(
              undefined,
              "Delete question from paper Successfully.",
              true,
              obj
            );
            res.end(jsonString);
          }
          res.end(jsonString);
        }
      );
    } else {
      logger.error("DVP-QAModule.DeleteQuestionFromPaper failed ");
      jsonString = msg.FormatMessage(
        undefined,
        "Question delete failed",
        false,
        undefined
      );
      res.end(jsonString);
    }

    return next();
  }
);

server.del(
  "/DVP/API/:version/QAModule/QuestionPaperSubmission/:id",
  authorization({ resource: "qualityassurance", action: "delete" }),
  function (req, res, next) {
    logger.debug("DVP-QAModule.DeleteQuestionFromPaper HTTP");
    var company;
    var tenant;
    var jsonString;

    if (req && req.user && req.user.company && req.user.tenant) {
      company = req.user.company;
      tenant = req.user.tenant;

      logger.info("DVP-QAModule.DeleteQuestionPaperSubmission successful");
      //jsonString = msg.FormatMessage(err, "Question creation successful", true, question);

      Submission.findOneAndRemove(
        {
          _id: req.params.id,
          company: company,
          tenant: tenant,
        },
        function (err, questions) {
          //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
          if (err) {
            jsonString = msg.FormatMessage(
              err,
              "Delete submission failed",
              false,
              undefined
            );
          } else {
            if (questions) {
              jsonString = msg.FormatMessage(
                undefined,
                "Delete submission Successful",
                true,
                questions
              );
            } else {
              jsonString = msg.FormatMessage(
                undefined,
                "No question Found",
                false,
                questions
              );
            }
          }

          res.end(jsonString);
        }
      );
    } else {
      logger.error("DVP-QAModule.DeleteQuestionFromPaper failed ");
      jsonString = msg.FormatMessage(
        undefined,
        "Submission delete failed",
        false,
        undefined
      );
      res.end(jsonString);
    }

    return next();
  }
);

server.post(
  "/DVP/API/:version/QAModule/QuestionPaperSubmission",
  authorization({ resource: "qualityassurance", action: "write" }),
  function (req, res, next) {
    logger.debug("DVP-QAModule.QuestionPaperSubmission HTTP");
    var company;
    var tenant;

    if (req && req.user && req.user.company && req.user.tenant) {
      company = req.user.company;
      tenant = req.user.tenant;

      if (req.body) {
        var submission = Submission({
          paper: req.body.paper,
          session: req.body.session,
          evaluator: req.body.evaluator,
          owner: req.body.owner,
          company: company,
          tenant: tenant,
        });

        var message;
        submission.save(function (err, sub) {
          if (err) {
            logger.error("DVP-QAModule.QuestionPaperSubmission failed ", err);
            var message = msg.FormatMessage(
              err,
              "Question Paper submission failed",
              false,
              undefined
            );
          } else {
            if (sub) {
              logger.info("DVP-QAModule.QuestionPaperSubmission successful");
              var message = msg.FormatMessage(
                err,
                "Question paper submission successful",
                true,
                sub
              );
            } else {
              logger.error("DVP-QAModule.QuestionPaperSubmission failed ");
              var message = msg.FormatMessage(
                undefined,
                "Question paper submission failed",
                false,
                undefined
              );
            }
          }
          res.write(message);
          res.end();
        });
      } else {
        logger.error(
          "DVP-QAModule.QuestionPaperSubmission request.body is null"
        );
        var instance = msg.FormatMessage(
          undefined,
          "create paper submission failed",
          false,
          undefined
        );
        res.write(instance);
        res.end();
      }
    } else {
      res.write(
        msg.FormatMessage(
          err,
          "Token error, no company data found",
          false,
          undefined
        )
      );
      res.end();
    }

    return next();
  }
);

server.put(
  "/DVP/API/:version/QAModule/QuestionPaperSubmission/:id/QuestionAnswer",
  authorization({ resource: "qualityassurance", action: "write" }),
  function (req, res, next) {
    logger.debug("DVP-QAModule.AddAnswerToSubmission HTTP");
    var company;
    var tenant;
    var jsonString;

    if (req && req.user && req.user.company && req.user.tenant) {
      company = req.user.company;
      tenant = req.user.tenant;

      if (req.body) {
        Submission.findOne(
          {
            _id: req.params.id,
            completed: false,
            company: company,
            tenant: tenant,
          },
          function (err, sub) {
            //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
            if (err) {
              jsonString = msg.FormatMessage(
                err,
                "Get paper submission failed",
                false,
                undefined
              );
              res.end(jsonString);
            } else {
              if (sub) {
                jsonString = msg.FormatMessage(
                  undefined,
                  "Get paper submission Successful",
                  true,
                  sub
                );

                var answer = Answer({
                  question: req.body.question,
                  section: req.body.section,
                  points: req.body.points,
                  remarks: req.body.remarks,
                  company: company,
                  tenant: tenant,
                });

                var message;
                answer.save(function (err, answer) {
                  if (err) {
                    logger.error("DVP-QAModule.CreateAnswer failed ", err);
                    jsonString = msg.FormatMessage(
                      err,
                      "Answer creation failed",
                      false,
                      undefined
                    );
                    res.end(jsonString);
                  } else {
                    if (answer) {
                      logger.info("DVP-QAModule.CreateAnswer successful");
                      jsonString = msg.FormatMessage(
                        err,
                        "Answer creation successful",
                        true,
                        answer
                      );

                      sub.update(
                        {
                          $set: {
                            updated_at: Date.now(),
                          },
                          $addToSet: { answers: answer.id },
                        },
                        function (err, obj) {
                          if (err) {
                            jsonString = msg.FormatMessage(
                              err,
                              "Fail to Find Submission",
                              false,
                              undefined
                            );
                            res.end(jsonString);
                          } else {
                            jsonString = msg.FormatMessage(
                              undefined,
                              "Add answer to submission Successfully.",
                              true,
                              obj
                            );
                            res.end(jsonString);
                          }
                          res.end(jsonString);
                        }
                      );
                    } else {
                      logger.error("DVP-QAModule.CreateAnswer failed ");
                      jsonString = msg.FormatMessage(
                        undefined,
                        "Answer creation failed",
                        false,
                        undefined
                      );
                      res.end(jsonString);
                    }
                  }
                });
              } else {
                jsonString = msg.FormatMessage(
                  undefined,
                  "No question paper Found",
                  false,
                  undefined
                );
                res.end(jsonString);
              }
            }
          }
        );
      } else {
        logger.error("DVP-QAModule.AddAnswerToSubmission request.body is null");
        jsonString = msg.FormatMessage(
          undefined,
          "add answer to submission failed",
          false,
          undefined
        );
        res.end(jsonString);
      }
    } else {
      jsonString = msg.FormatMessage(
        err,
        "Token error, no company data found",
        false,
        undefined
      );
      res.end(jsonString);
    }

    return next();
  }
);

server.del(
  "/DVP/API/:version/QAModule/QuestionPaperSubmission/:id/QuestionAnswer/:qid",
  authorization({ resource: "qualityassurance", action: "delete" }),
  function (req, res, next) {
    logger.debug("DVP-QAModule.DeleteAnswerFromSubmission HTTP");
    var company;
    var tenant;
    var jsonString;

    if (req && req.user && req.user.company && req.user.tenant) {
      company = req.user.company;
      tenant = req.user.tenant;

      logger.info("DVP-QAModule.DeleteAnswerFromSubmission successful");
      //jsonString = msg.FormatMessage(err, "Question creation successful", true, question);

      Submission.update(
        {
          _id: req.params.id,
          completed: false,
          company: company,
          tenant: tenant,
        },
        {
          $set: {
            updated_at: Date.now(),
          },
          $pullAll: { answers: [req.params.qid] },
        },
        function (err, obj) {
          if (err) {
            jsonString = msg.FormatMessage(
              err,
              "Fail to Find Submission",
              false,
              undefined
            );
            res.end(jsonString);
          } else {
            jsonString = msg.FormatMessage(
              undefined,
              "Delete answer from submission Successfully.",
              true,
              obj
            );
            res.end(jsonString);
          }
          res.end(jsonString);
        }
      );
    } else {
      logger.error("DVP-QAModule.DeleteAnswerFromSubmission failed ");
      jsonString = msg.FormatMessage(
        undefined,
        "Answer delete failed",
        false,
        undefined
      );
      res.end(jsonString);
    }

    return next();
  }
);

server.put(
  "/DVP/API/:version/QAModule/QuestionPaperSubmission/:id/Complete",
  authorization({ resource: "qualityassurance", action: "write" }),
  function (req, res, next) {
    logger.debug("DVP-QAModule.UpdateAnswerFromSubmission HTTP");
    var company;
    var tenant;
    var jsonString;

    if (req && req.user && req.user.company && req.user.tenant) {
      company = req.user.company;
      tenant = req.user.tenant;

      logger.info("DVP-QAModule.UpdateAnswerFromSubmission successful");
      //jsonString = msg.FormatMessage(err, "Question creation successful", true, question);

      Submission.update(
        {
          _id: req.params.id,
          completed: false,
          company: company,
          tenant: tenant,
        },
        {
          $set: {
            updated_at: Date.now(),
            completed: true,
          },
        },
        function (err, obj) {
          if (err) {
            jsonString = msg.FormatMessage(
              err,
              "Fail to Find Submission",
              false,
              undefined
            );
            res.end(jsonString);
          } else {
            jsonString = msg.FormatMessage(
              undefined,
              "Update submission Successfully.",
              true,
              obj
            );
            res.end(jsonString);
          }
          res.end(jsonString);
        }
      );
    } else {
      logger.error("DVP-QAModule.UpdateAnswerFromSubmission failed ");
      jsonString = msg.FormatMessage(
        undefined,
        "Update Submission failed",
        false,
        undefined
      );
      res.end(jsonString);
    }

    return next();
  }
);

server.get(
  "/DVP/API/:version/QAModule/QuestionPaperSubmission",
  authorization({ resource: "qualityassurance", action: "read" }),
  function (req, res, next) {
    logger.info("DVP-QAModule.GetQuestionPaperSubmission Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Submission.find(
      {
        company: company,
        tenant: tenant,
      },
      function (err, sub) {
        //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
        if (err) {
          jsonString = msg.FormatMessage(
            err,
            "Get all papers submission failed",
            false,
            undefined
          );
        } else {
          if (sub) {
            jsonString = msg.FormatMessage(
              undefined,
              "Get all papers submission  Successful",
              true,
              sub
            );
          } else {
            jsonString = msg.FormatMessage(
              undefined,
              "No question papers Found",
              false,
              qp
            );
          }
        }

        res.end(jsonString);
      }
    );

    next();
  }
);

server.get(
  "/DVP/API/:version/QAModule/QuestionPaperSubmission/:id",
  authorization({ resource: "qualityassurance", action: "read" }),
  function (req, res, next) {
    logger.info("DVP-QAModule.QuestionPaperSubmission Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Submission.findOne(
      {
        _id: req.params.id,
        company: company,
        tenant: tenant,
      },
      function (err, sub) {
        //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
        if (err) {
          jsonString = msg.FormatMessage(
            err,
            "Get paper submission failed",
            false,
            undefined
          );
        } else {
          if (sub) {
            jsonString = msg.FormatMessage(
              undefined,
              "Get paper submission Successful",
              true,
              sub
            );
          } else {
            jsonString = msg.FormatMessage(
              undefined,
              "No paper submission Found",
              false,
              undefined
            );
          }
        }

        res.end(jsonString);
      }
    );

    next();
  }
);

server.get(
  "/DVP/API/:version/QAModule/QuestionPaperSubmission/Session/:id",
  authorization({ resource: "qualityassurance", action: "read" }),
  function (req, res, next) {
    logger.info("DVP-QAModule.QuestionPaperSubmission Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);

    Submission.findOne({
      session: req.params.id,
      company: company,
      tenant: tenant,
    })
      .populate("paper")
      .exec(function (err, sub) {
        //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
        if (err) {
          jsonString = msg.FormatMessage(
            err,
            "Get paper submission failed",
            false,
            undefined
          );
        } else {
          if (sub) {
            jsonString = msg.FormatMessage(
              undefined,
              "Get paper submission Successful",
              true,
              sub
            );
          } else {
            jsonString = msg.FormatMessage(
              undefined,
              "No paper submission Found",
              true,
              null
            );
          }
        }

        res.end(jsonString);
      });

    next();
  }
);

server.get(
  "/DVP/API/:version/QAModule/QuestionPaperSubmission/Owner/:owner/Completed/:status",
  authorization({ resource: "qualityassurance", action: "read" }),
  function (req, res, next) {
    logger.info("DVP-QAModule.GetQuestionPaperSubmission Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    /*TicketStatusFlow.find({company: company, tenant: tenant}).populate({path: 'flow_nodes.node',populate : {path: 'TicketStatusNode'}})
        .populate('flow_connections.source').populate('flow_connections.targets').exec(function (err, stf) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(err, "Get StatusFlow Failed", false, undefined);
            } else {
                jsonString = messageFormatter.FormatMessage(undefined, "Get StatusFlow Successful", true, stf);
            }
            res.end(jsonString);
        });*/

    Submission.find({
      company: company,
      tenant: tenant,
      completed: req.params.status,
      owner: req.params.owner,
    })
      .populate("paper")
      .populate("evaluator")
      .populate({
        path: "answers",
        populate: [{ path: "question" }, { path: "section" }],
      })
      .exec(function (err, sub) {
        //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
        if (err) {
          jsonString = msg.FormatMessage(
            err,
            "Get all papers submission failed",
            false,
            undefined
          );
        } else {
          if (sub) {
            jsonString = msg.FormatMessage(
              undefined,
              "Get all papers submission  Successful",
              true,
              sub
            );
          } else {
            jsonString = msg.FormatMessage(
              undefined,
              "No question papers Found",
              false,
              qp
            );
          }
        }

        res.end(jsonString);
      });

    next();
  }
);

server.get(
  "/DVP/API/:version/QAModule/QuestionPaperSubmission/Owner/:owner/Completed/:status/From/:stDate/To/:eDate",
  authorization({ resource: "qualityassurance", action: "read" }),
  function (req, res, next) {
    logger.info("DVP-QAModule.GetQuestionPaperSubmission Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    console.log();

    /*TicketStatusFlow.find({company: company, tenant: tenant}).populate({path: 'flow_nodes.node',populate : {path: 'TicketStatusNode'}})
     .populate('flow_connections.source').populate('flow_connections.targets').exec(function (err, stf) {
     if (err) {
     jsonString = messageFormatter.FormatMessage(err, "Get StatusFlow Failed", false, undefined);
     } else {
     jsonString = messageFormatter.FormatMessage(undefined, "Get StatusFlow Successful", true, stf);
     }
     res.end(jsonString);
     });*/

    Submission.find({
      company: company,
      tenant: tenant,
      completed: req.params.status,
      owner: req.params.owner,
      created_at: {
        $gte: new Date(req.params.stDate),
        $lt: new Date(req.params.eDate),
      },
    })
      .populate("paper")
      .populate({
        path: "answers",
        populate: [{ path: "question" }, { path: "section" }],
      })
      .exec(function (err, sub) {
        //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
        if (err) {
          jsonString = msg.FormatMessage(
            err,
            "Get all papers submission failed",
            false,
            undefined
          );
        } else {
          if (sub) {
            jsonString = msg.FormatMessage(
              undefined,
              "Get all papers submission  Successful",
              true,
              sub
            );
          } else {
            jsonString = msg.FormatMessage(
              undefined,
              "No question papers Found",
              false,
              qp
            );
          }
        }

        res.end(jsonString);
      });

    next();
  }
);
