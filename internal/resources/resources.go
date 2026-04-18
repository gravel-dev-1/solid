package resources

type Runner func() error

func Run(runners ...Runner) (err error) {
	for _, runner := range runners {
		if err = runner(); err != nil {
			return err
		}
	}
	return err
}
