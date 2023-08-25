package main

// Raised for errors regarding failed parsing of string data to proper structs.
type ParseError struct {
	Msg string
}

func (e *ParseError) Error() string {
	return e.Msg
}

// Raised for errors regarding failed data fetching.
type FetchError struct {
	Msg string
}

func (e *FetchError) Error() string {
	return e.Msg
}

// Raised for errors regarding an excessive number of requests in a given time.
type BusyError struct {
	Msg string
}

func (e *BusyError) Error() string {
	return e.Msg
}

// Raised for errors regarding WPA socket communication.
type SockCommError struct {
	Msg string
}

func (e *SockCommError) Error() string {
	return e.Msg
}

// Raised when a WPA operation fails.
type WPAOperationFail struct {
	Msg string
}

func (e *WPAOperationFail) Error() string {
	return e.Msg
}

// Raised when a WPA add_network operation fails to return an int.
type NetworkAddFail struct {
	Msg string
}

func (e *NetworkAddFail) Error() string {
	return e.Msg
}
