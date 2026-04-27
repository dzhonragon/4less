grammar Grammar;

prog: element* EOF;

element
    : ID shorthand* (STRING)? attribute* (LBRACE element* RBRACE)?  # elementBlock
    ;

shorthand
    : '.' ID    # classShorthand
    | '#' ID    # idShorthand
    ;

attribute
    : ID ':' STRING
    ;

ID     : [a-zA-Z_][a-zA-Z0-9_-]* ;
STRING : '"' (~["\r\n])* '"' ;
LBRACE : '{' ;
RBRACE : '}' ;
WS     : [ \t\r\n]+ -> skip ;
